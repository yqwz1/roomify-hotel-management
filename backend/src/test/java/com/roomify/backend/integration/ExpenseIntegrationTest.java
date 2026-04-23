package com.roomify.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.repository.ExpenseRepository;
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
import java.time.LocalDate;
import java.util.Map;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:expensedb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class ExpenseIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ExpenseRepository expenseRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String managerToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        expenseRepository.deleteAll();
        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");
    }

    @Test
    void managerCanCreateEditDeleteAndFilterExpenses() throws Exception {
        String createPayload = objectMapper.writeValueAsString(Map.of(
                "title", "Cleaning detergent",
                "description", "Refill stock",
                "category", "CLEANING_SUPPLIES",
                "amount", new BigDecimal("45.90"),
                "expenseDate", "2026-04-24",
                "vendor", "Sparkle Supply",
                "paymentMethod", "CARD",
                "recurring", false));

        String response = mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Cleaning detergent"))
                .andExpect(jsonPath("$.amount").value(45.90))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long expenseId = objectMapper.readTree(response).get("id").asLong();

        String updatePayload = objectMapper.writeValueAsString(Map.of(
                "title", "Cleaning detergent",
                "description", "Refill stock and gloves",
                "category", "CONSUMABLES",
                "amount", new BigDecimal("52.10"),
                "expenseDate", "2026-04-24",
                "vendor", "Sparkle Supply",
                "paymentMethod", "CASH",
                "recurring", true));

        mockMvc.perform(put("/api/expenses/{id}", expenseId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("CONSUMABLES"))
                .andExpect(jsonPath("$.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.recurring").value(true));

        Expense additionalExpense = new Expense();
        additionalExpense.setTitle("Office forms");
        additionalExpense.setCategory(ExpenseCategory.OFFICE_ADMIN);
        additionalExpense.setAmount(new BigDecimal("18.50"));
        additionalExpense.setExpenseDate(LocalDate.of(2026, 4, 25));
        additionalExpense.setVendor("Admin Shop");
        additionalExpense.setPaymentMethod(PaymentMethod.CARD);
        expenseRepository.save(additionalExpense);

        mockMvc.perform(get("/api/expenses")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("startDate", "2026-04-20")
                        .param("endDate", "2026-04-30")
                        .param("vendor", "sparkle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(expenseId));

        mockMvc.perform(get("/api/expenses/summary")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("startDate", "2026-04-20")
                        .param("endDate", "2026-04-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalExpenses").value(70.60))
                .andExpect(jsonPath("$.expenseCount").value(2))
                .andExpect(jsonPath("$.categoryBreakdown.length()").value(2))
                .andExpect(jsonPath("$.recentExpenses.length()").value(2));

        mockMvc.perform(delete("/api/expenses/{id}", expenseId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/expenses/{id}", expenseId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void expenseValidationFailuresReturnReadableErrors() throws Exception {
        String invalidPayload = objectMapper.writeValueAsString(Map.of(
                "title", "",
                "category", "CLEANING_SUPPLIES",
                "amount", new BigDecimal("-5.00"),
                "expenseDate", "2026-04-24"));

        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.title").exists())
                .andExpect(jsonPath("$.validationErrors.amount").exists());
    }

    @Test
    void staffCannotAccessExpenseEndpoints() throws Exception {
        mockMvc.perform(get("/api/expenses")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/expenses/summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }
}
