package com.roomify.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.InventoryItem;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.InventoryItemRepository;
import com.roomify.backend.repository.InventoryTransactionRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.repository.ServiceUsageRecordRepository;
import com.roomify.backend.repository.ServiceUsageTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:inventorydb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class InventoryIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private ServiceUsageTemplateRepository serviceUsageTemplateRepository;

    @Autowired
    private ServiceUsageRecordRepository serviceUsageRecordRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String managerToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        serviceUsageRecordRepository.deleteAll();
        serviceUsageTemplateRepository.deleteAll();
        inventoryTransactionRepository.deleteAll();
        expenseRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        inventoryItemRepository.deleteAll();

        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
    }

    @Test
    void automationTracksPurchaseSpendAndConsumptionWithoutDoubleCounting() throws Exception {
        RoomType roomType = roomTypeRepository.save(new RoomType(
                "Standard Room",
                new BigDecimal("120.00"),
                2,
                "WiFi,TV",
                "Standard room"));
        Room room = roomRepository.save(new Room("101", roomType, 1, RoomStatus.NEEDS_CLEANING));

        String itemPayload = objectMapper.writeValueAsString(Map.of(
                "name", "Surface Cleaner",
                "category", "CLEANING_CHEMICALS",
                "unitOfMeasure", "BOTTLE",
                "minimumStockThreshold", new BigDecimal("16.000"),
                "defaultUnitCost", new BigDecimal("5.0000"),
                "initialStockQuantity", new BigDecimal("0.000"),
                "supplier", "Sparkle Supply",
                "sku", "CLN-101",
                "active", true,
                "notes", "Core cleaning stock"));

        String itemResponse = mockMvc.perform(post("/api/inventory/items")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Surface Cleaner"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long itemId = objectMapper.readTree(itemResponse).get("id").asLong();

        String restockPayload = objectMapper.writeValueAsString(Map.of(
                "quantity", new BigDecimal("20.000"),
                "unitCost", new BigDecimal("5.0000"),
                "occurredAt", "2026-04-24T10:00:00",
                "supplier", "Sparkle Supply",
                "notes", "Weekly purchase",
                "linkToExpense", true));

        mockMvc.perform(post("/api/inventory/items/{id}/restock", itemId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(restockPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.linkedExpense.amount").value(100.00))
                .andExpect(jsonPath("$.transaction.stockAfter").value(20.000));

        String templatePayload = objectMapper.writeValueAsString(Map.of(
                "name", "Standard room cleaning",
                "serviceType", "STANDARD_ROOM_CLEANING",
                "roomTypeId", roomType.getId(),
                "active", true,
                "notes", "Default standard clean",
                "items", new Object[] {
                        Map.of(
                                "inventoryItemId", itemId,
                                "standardQuantity", new BigDecimal("2.000"),
                                "active", true,
                                "notes", "Standard bottle usage")
                }));

        mockMvc.perform(post("/api/inventory/templates")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(templatePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items.length()").value(1));

        String previewPayload = objectMapper.writeValueAsString(Map.of(
                "serviceType", "STANDARD_ROOM_CLEANING"));

        mockMvc.perform(post("/api/rooms/{id}/service-preview", room.getId())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(previewPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.templateName").value("Standard room cleaning"))
                .andExpect(jsonPath("$.estimatedTotalCost").value(10.00));

        String completionPayload = objectMapper.writeValueAsString(Map.of(
                "serviceType", "STANDARD_ROOM_CLEANING",
                "performedAt", "2026-04-24T11:00:00",
                "notes", "Used extra cleaner on checkout",
                "items", new Object[] {
                        Map.of(
                                "inventoryItemId", itemId,
                                "actualQuantity", new BigDecimal("5.000"))
                }));

        mockMvc.perform(post("/api/rooms/{id}/complete-service", room.getId())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completionPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.room.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.usageRecord.totalCost").value(25.00))
                .andExpect(jsonPath("$.warnings[0]").value("Low stock: Surface Cleaner"));

        mockMvc.perform(get("/api/inventory/summary")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("startDate", "2026-04-24")
                        .param("endDate", "2026-04-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPurchaseSpend").value(100.00))
                .andExpect(jsonPath("$.totalConsumptionValue").value(25.00))
                .andExpect(jsonPath("$.lowStockCount").value(1))
                .andExpect(jsonPath("$.topConsumedItems[0].label").value("Surface Cleaner"));

        mockMvc.perform(get("/api/expenses/summary")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("startDate", "2026-04-24")
                        .param("endDate", "2026-04-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalExpenses").value(100.00));

        InventoryItem updatedItem = inventoryItemRepository.findById(itemId).orElseThrow();
        assertEquals(0, updatedItem.getCurrentStockQuantity().compareTo(new BigDecimal("15.000")));

        Expense expense = expenseRepository.findAll().getFirst();
        assertEquals(0, expense.getAmount().compareTo(new BigDecimal("100.00")));
    }

    @Test
    void completionBlocksWhenStockWouldGoNegative() throws Exception {
        RoomType roomType = roomTypeRepository.save(new RoomType(
                "Deluxe Room",
                new BigDecimal("180.00"),
                2,
                "WiFi,Mini Bar",
                "Deluxe room"));
        Room room = roomRepository.save(new Room("202", roomType, 2, RoomStatus.NEEDS_CLEANING));

        InventoryItem item = new InventoryItem();
        item.setName("Trash Bag");
        item.setCategory(com.roomify.backend.entity.InventoryCategory.CONSUMABLES);
        item.setUnitOfMeasure(com.roomify.backend.entity.InventoryUnitOfMeasure.PIECE);
        item.setCurrentStockQuantity(new BigDecimal("1.000"));
        item.setMinimumStockThreshold(BigDecimal.ZERO);
        item.setDefaultUnitCost(new BigDecimal("1.0000"));
        item.setAverageUnitCost(new BigDecimal("1.0000"));
        item.setActive(true);
        inventoryItemRepository.save(item);

        String templatePayload = objectMapper.writeValueAsString(Map.of(
                "name", "Checkout cleaning",
                "serviceType", "STANDARD_ROOM_CLEANING",
                "roomTypeId", roomType.getId(),
                "active", true,
                "items", new Object[] {
                        Map.of(
                                "inventoryItemId", item.getId(),
                                "standardQuantity", new BigDecimal("2.000"),
                                "active", true)
                }));

        mockMvc.perform(post("/api/inventory/templates")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(templatePayload))
                .andExpect(status().isCreated());

        String completionPayload = objectMapper.writeValueAsString(Map.of(
                "serviceType", "STANDARD_ROOM_CLEANING",
                "performedAt", "2026-04-24T12:00:00"));

        mockMvc.perform(post("/api/rooms/{id}/complete-service", room.getId())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completionPayload))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Insufficient stock for: Trash Bag"));
    }
}
