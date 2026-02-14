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
 * Integration tests for Room CRUD operations and security.
 */
@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:roomdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class RoomIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    private ObjectMapper objectMapper;
    private String managerToken;
    private String staffToken;
    private String guestToken;
    private Long roomTypeId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        // Generate tokens
        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");
        guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");

        // Clean up and create test room type
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();

        RoomType roomType = new RoomType(
                "Standard Room",
                new BigDecimal("100.00"),
                2,
                "WiFi, TV",
                "Standard room");
        roomTypeId = roomTypeRepository.save(roomType).getId();
    }

    @Test
    void createRoomWithValidDataReturnsCreated() throws Exception {
        Map<String, Object> roomData = Map.of(
                "roomNumber", "101",
                "roomTypeId", roomTypeId,
                "floor", 1,
                "status", "AVAILABLE");

        String json = objectMapper.writeValueAsString(roomData);

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.roomNumber").value("101"))
                .andExpect(jsonPath("$.floor").value(1))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.roomType.id").value(roomTypeId))
                .andExpect(jsonPath("$.roomType.name").value("Standard Room"));
    }

    @Test
    void createRoomWithDuplicateNumberReturnsConflict() throws Exception {
        // Create first room
        Map<String, Object> room1 = Map.of(
                "roomNumber", "202",
                "roomTypeId", roomTypeId,
                "floor", 2,
                "status", "AVAILABLE");

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(room1)))
                .andExpect(status().isCreated());

        // Try to create duplicate
        Map<String, Object> room2 = Map.of(
                "roomNumber", "202",
                "roomTypeId", roomTypeId,
                "floor", 3,
                "status", "AVAILABLE");

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(room2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Room with number '202' already exists"));
    }

    @Test
    void createRoomWithNonExistentRoomTypeReturnsNotFound() throws Exception {
        Map<String, Object> roomData = Map.of(
                "roomNumber", "303",
                "roomTypeId", 99999,
                "floor", 3,
                "status", "AVAILABLE");

        String json = objectMapper.writeValueAsString(roomData);

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Room type not found with id: 99999"));
    }

    @Test
    void getAllRoomsReturnsAllRooms() throws Exception {
        // Create multiple rooms
        for (int i = 1; i <= 3; i++) {
            Map<String, Object> roomData = Map.of(
                    "roomNumber", "10" + i,
                    "roomTypeId", roomTypeId,
                    "floor", 1,
                    "status", "AVAILABLE");

            mockMvc.perform(post("/api/rooms")
                    .header("Authorization", "Bearer " + managerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(roomData)))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(get("/api/rooms")
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void getRoomByIdReturnsCorrectRoom() throws Exception {
        // Create a room
        Map<String, Object> roomData = Map.of(
                "roomNumber", "505",
                "roomTypeId", roomTypeId,
                "floor", 5,
                "status", "AVAILABLE");

        String createJson = objectMapper.writeValueAsString(roomData);

        String response = mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createJson))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long roomId = objectMapper.readTree(response).get("id").asLong();

        // Get the room by ID
        mockMvc.perform(get("/api/rooms/" + roomId)
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(roomId))
                .andExpect(jsonPath("$.roomNumber").value("505"))
                .andExpect(jsonPath("$.floor").value(5))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void getNonExistentRoomReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/rooms/99999")
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Room not found with id: 99999"));
    }

    @Test
    void updateRoomWithValidDataReturnsUpdated() throws Exception {
        // Create a room
        Map<String, Object> createData = Map.of(
                "roomNumber", "606",
                "roomTypeId", roomTypeId,
                "floor", 6,
                "status", "AVAILABLE");

        String createResponse = mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createData)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long roomId = objectMapper.readTree(createResponse).get("id").asLong();

        // Update the room
        Map<String, Object> updateData = Map.of(
                "roomNumber", "606",
                "roomTypeId", roomTypeId,
                "floor", 6,
                "status", "MAINTENANCE");

        mockMvc.perform(put("/api/rooms/" + roomId)
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(roomId))
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));
    }

    @Test
    void updateRoomWithDuplicateNumberReturnsConflict() throws Exception {
        // Create two rooms
        Map<String, Object> room1 = Map.of(
                "roomNumber", "701",
                "roomTypeId", roomTypeId,
                "floor", 7,
                "status", "AVAILABLE");

        Map<String, Object> room2 = Map.of(
                "roomNumber", "702",
                "roomTypeId", roomTypeId,
                "floor", 7,
                "status", "AVAILABLE");

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(room1)))
                .andExpect(status().isCreated());

        String room2Response = mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(room2)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long room2Id = objectMapper.readTree(room2Response).get("id").asLong();

        // Try to update room2 to have the same number as room1
        Map<String, Object> updateData = Map.of(
                "roomNumber", "701",
                "roomTypeId", roomTypeId,
                "floor", 7,
                "status", "AVAILABLE");

        mockMvc.perform(put("/api/rooms/" + room2Id)
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Room with number '701' already exists"));
    }

    @Test
    void deleteRoomReturnsNoContent() throws Exception {
        // Create a room
        Map<String, Object> roomData = Map.of(
                "roomNumber", "801",
                "roomTypeId", roomTypeId,
                "floor", 8,
                "status", "AVAILABLE");

        String response = mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(roomData)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long roomId = objectMapper.readTree(response).get("id").asLong();

        // Delete the room
        mockMvc.perform(delete("/api/rooms/" + roomId)
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        // Verify it's deleted
        mockMvc.perform(get("/api/rooms/" + roomId)
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void staffCannotCreateRoom() throws Exception {
        Map<String, Object> roomData = Map.of(
                "roomNumber", "901",
                "roomTypeId", roomTypeId,
                "floor", 9,
                "status", "AVAILABLE");

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + staffToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(roomData)))
                .andExpect(status().isForbidden());
    }

    @Test
    void guestCannotCreateRoom() throws Exception {
        Map<String, Object> roomData = Map.of(
                "roomNumber", "902",
                "roomTypeId", roomTypeId,
                "floor", 9,
                "status", "AVAILABLE");

        mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + guestToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(roomData)))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCannotAccessRoomsList() throws Exception {
        mockMvc.perform(get("/api/rooms")
                .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void guestCannotDeleteRoom() throws Exception {
        // Create a room as manager
        Map<String, Object> roomData = Map.of(
                "roomNumber", "999",
                "roomTypeId", roomTypeId,
                "floor", 9,
                "status", "AVAILABLE");

        String response = mockMvc.perform(post("/api/rooms")
                .header("Authorization", "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(roomData)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long roomId = objectMapper.readTree(response).get("id").asLong();

        // Try to delete as guest
        mockMvc.perform(delete("/api/rooms/" + roomId)
                .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isForbidden());
    }
}
