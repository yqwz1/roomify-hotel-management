package com.roomify.backend.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * Integration tests for RoomType CRUD operations and security.
 */
@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:roomtypedb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class RoomTypeIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    private ObjectMapper objectMapper;
    private String managerToken;
    private String staffToken;
    private String guestToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        // Generate tokens for different roles
        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");
        guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");

        // Clean up before each test
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
    }

    @Test
    void createRoomTypeWithValidDataReturnsCreated() throws Exception {
        Map<String, Object> roomTypeData = Map.of(
                "name", "Deluxe Suite",
                "basePrice", 299.99,
                "maxGuests", 4,
                "amenities", "WiFi, TV, Mini Bar",
                "description", "Luxury suite with ocean view");

        String json = objectMapper.writeValueAsString(roomTypeData);

        mockMvc.perform(post("/api/room-types")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Deluxe Suite"))
                .andExpect(jsonPath("$.basePrice").value(299.99))
                .andExpect(jsonPath("$.maxGuests").value(4))
                .andExpect(jsonPath("$.amenities").value("WiFi, TV, Mini Bar"))
                .andExpect(jsonPath("$.description").value("Luxury suite with ocean view"));
    }

    @Test
    void createRoomTypeWithDuplicateNameReturnsConflict() throws Exception {
        // Create first room type
        RoomType roomType = new RoomType(
                "Standard Room",
                new BigDecimal("100.00"),
                2,
                "WiFi, TV",
                "Basic room");
        roomTypeRepository.save(roomType);

        // Try to create duplicate
        Map<String, Object> duplicateData = Map.of(
                "name", "Standard Room",
                "basePrice", 120.00,
                "maxGuests", 2,
                "amenities", "WiFi",
                "description", "Another standard room");

        String json = objectMapper.writeValueAsString(duplicateData);

        mockMvc.perform(post("/api/room-types")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Room type 'Standard Room' already exists"));
    }

    @Test
    void getAllRoomTypesReturnsAllTypes() throws Exception {
        // Create multiple room types
        roomTypeRepository.save(new RoomType("Economy", new BigDecimal("80.00"), 2, "WiFi", "Budget room"));
        roomTypeRepository.save(new RoomType("Standard", new BigDecimal("120.00"), 2, "WiFi, TV", "Standard room"));
        roomTypeRepository
                .save(new RoomType("Deluxe", new BigDecimal("200.00"), 4, "WiFi, TV, Mini Bar", "Deluxe room"));

        mockMvc.perform(get("/api/room-types")
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void getRoomTypeByIdReturnsCorrectType() throws Exception {
        RoomType saved = roomTypeRepository.save(
                new RoomType("VIP Suite", new BigDecimal("500.00"), 6, "WiFi, TV, Mini Bar, Jacuzzi", "VIP room"));

        mockMvc.perform(get("/api/room-types/" + saved.getId())
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.name").value("VIP Suite"))
                .andExpect(jsonPath("$.basePrice").value(500.00));
    }

    @Test
    void getNonExistentRoomTypeReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/room-types/99999")
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Room type not found with id: 99999"));
    }

    @Test
    void updateRoomTypeWithValidDataReturnsUpdated() throws Exception {
        RoomType saved = roomTypeRepository.save(
                new RoomType("Budget Room", new BigDecimal("70.00"), 1, "WiFi", "Cheap room"));

        Map<String, Object> updateData = Map.of(
                "name", "Budget Room",
                "basePrice", 75.00,
                "maxGuests", 2,
                "amenities", "WiFi, TV",
                "description", "Updated budget room");

        String json = objectMapper.writeValueAsString(updateData);

        mockMvc.perform(put("/api/room-types/" + saved.getId())
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.basePrice").value(75.00))
                .andExpect(jsonPath("$.maxGuests").value(2))
                .andExpect(jsonPath("$.description").value("Updated budget room"));
    }

    @Test
    void updateRoomTypeWithDuplicateNameReturnsConflict() throws Exception {
        RoomType type1 = roomTypeRepository.save(
                new RoomType("Type A", new BigDecimal("100.00"), 2, "WiFi", "Type A"));

        RoomType type2 = roomTypeRepository.save(
                new RoomType("Type B", new BigDecimal("150.00"), 3, "WiFi, TV", "Type B"));

        // Try to update type2 to have the same name as type1
        Map<String, Object> updateData = Map.of(
                "name", "Type A",
                "basePrice", 150.00,
                "maxGuests", 3,
                "amenities", "WiFi, TV",
                "description", "Trying to use duplicate name");

        String json = objectMapper.writeValueAsString(updateData);

        mockMvc.perform(put("/api/room-types/" + type2.getId())
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Room type 'Type A' already exists"));
    }

    @Test
    void deleteRoomTypeWithNoRoomsReturnsNoContent() throws Exception {
        RoomType saved = roomTypeRepository.save(
                new RoomType("Temporary Type", new BigDecimal("100.00"), 2, "WiFi", "Will be deleted"));

        mockMvc.perform(delete("/api/room-types/" + saved.getId())
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        // Verify it's deleted
        mockMvc.perform(get("/api/room-types/" + saved.getId())
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRoomTypeWithAssignedRoomsReturnsConflict() throws Exception {
        RoomType roomType = roomTypeRepository.save(
                new RoomType("Standard", new BigDecimal("100.00"), 2, "WiFi", "Has rooms"));

        // Create a room with this type
        Room room = new Room();
        room.setRoomNumber("101");
        room.setRoomType(roomType);
        room.setFloor(1);
        room.setStatus(com.roomify.backend.entity.RoomStatus.AVAILABLE);
        roomRepository.save(room);

        mockMvc.perform(delete("/api/room-types/" + roomType.getId())
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Cannot delete room type with assigned rooms"));
    }

    @Test
    void guestCannotCreateRoomType() throws Exception {
        Map<String, Object> roomTypeData = Map.of(
                "name", "Unauthorized Type",
                "basePrice", 100.00,
                "maxGuests", 2,
                "amenities", "None",
                "description", "Should fail");

        String json = objectMapper.writeValueAsString(roomTypeData);

        mockMvc.perform(post("/api/room-types")
                .header("Authorization", "Bearer " + guestToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCannotCreateRoomType() throws Exception {
        Map<String, Object> roomTypeData = Map.of(
                "name", "Staff Type",
                "basePrice", 100.00,
                "maxGuests", 2,
                "amenities", "WiFi",
                "description", "Staff attempt");

        String json = objectMapper.writeValueAsString(roomTypeData);

        mockMvc.perform(post("/api/room-types")
                .header("Authorization", "Bearer " + staffToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCannotUpdateRoomType() throws Exception {
        RoomType saved = roomTypeRepository.save(
                new RoomType("Original", new BigDecimal("100.00"), 2, "WiFi", "Original"));

        Map<String, Object> updateData = Map.of(
                "name", "Updated",
                "basePrice", 120.00,
                "maxGuests", 3,
                "amenities", "WiFi, TV",
                "description", "Updated by staff");

        String json = objectMapper.writeValueAsString(updateData);

        mockMvc.perform(put("/api/room-types/" + saved.getId())
                .header("Authorization", "Bearer " + staffToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void guestCannotDeleteRoomType() throws Exception {
        RoomType saved = roomTypeRepository.save(
                new RoomType("To Delete", new BigDecimal("100.00"), 2, "WiFi", "Delete me"));

        mockMvc.perform(delete("/api/room-types/" + saved.getId())
                .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isForbidden());
    }
}
