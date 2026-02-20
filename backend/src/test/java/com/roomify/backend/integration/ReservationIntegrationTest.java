package com.roomify.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
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
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reservationdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000",
        "roomify.reservations.tax-rate=0.10"
})
class ReservationIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    private ObjectMapper objectMapper;
    private String managerToken;
    private String staffToken;
    private String guestToken;
    private Long roomId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");
        guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");

        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("200.00"), 2, "WiFi, TV", "Deluxe room"));
        Room room = new Room("101", roomType, 1, RoomStatus.AVAILABLE);
        roomId = roomRepository.save(room).getId();
    }

    @Test
    void createReservationWithValidDataReturnsCreatedAndStoresConfirmation() throws Exception {
        LocalDate checkInDate = LocalDate.now().plusDays(5);
        LocalDate checkOutDate = checkInDate.plusDays(3);

        Map<String, Object> request = buildCreateReservationRequest(
                roomId,
                checkInDate.toString(),
                checkOutDate.toString(),
                "CONFIRMED",
                "John Doe",
                "john@example.com",
                "1234567890",
                "ID12345",
                "USA");

        String response = mockMvc.perform(post("/api/reservations")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmationNumber").isNotEmpty())
                .andExpect(jsonPath("$.roomId").value(roomId))
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.roomRate").value(200.00))
                .andExpect(jsonPath("$.subtotal").value(600.00))
                .andExpect(jsonPath("$.taxes").value(60.00))
                .andExpect(jsonPath("$.totalPrice").value(660.00))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String confirmationNumber = objectMapper.readTree(response).get("confirmationNumber").asText();
        Optional<Reservation> savedReservation = reservationRepository.findByConfirmationNumber(confirmationNumber);
        assertTrue(savedReservation.isPresent());
        assertEquals("CONFIRMED", savedReservation.get().getStatus().name());
    }

    @Test
    void createReservationWithExistingGuestReusesGuest() throws Exception {
        Guest existingGuest = guestRepository.save(
                new Guest("Existing Guest", "existing@example.com", "0500000000", "ID-EX-1", "USA"));

        LocalDate checkInDate = LocalDate.now().plusDays(10);
        LocalDate checkOutDate = checkInDate.plusDays(2);

        Map<String, Object> request = buildCreateReservationRequest(
                roomId,
                checkInDate.toString(),
                checkOutDate.toString(),
                "PENDING",
                "Existing Guest Updated",
                "existing@example.com",
                "0511111111",
                "ID-EX-1",
                "USA");

        mockMvc.perform(post("/api/reservations")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.guestId").value(existingGuest.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"));

        assertEquals(1L, guestRepository.count());
    }

    @Test
    void createReservationWithInvalidDateRangeReturnsBadRequest() throws Exception {
        LocalDate checkInDate = LocalDate.now().plusDays(5);
        LocalDate checkOutDate = checkInDate.minusDays(1);

        Map<String, Object> request = buildCreateReservationRequest(
                roomId,
                checkInDate.toString(),
                checkOutDate.toString(),
                "PENDING",
                "Invalid Dates",
                "invalid@example.com",
                "0555555555",
                "ID-BAD-DATE",
                "USA");

        mockMvc.perform(post("/api/reservations")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.validationErrors.dateRangeValid")
                        .value("Check-out date must be after check-in date"));
    }

    @Test
    void guestCannotCreateReservation() throws Exception {
        LocalDate checkInDate = LocalDate.now().plusDays(5);
        LocalDate checkOutDate = checkInDate.plusDays(1);

        Map<String, Object> request = buildCreateReservationRequest(
                roomId,
                checkInDate.toString(),
                checkOutDate.toString(),
                "PENDING",
                "Unauthorized Guest",
                "unauthorized@example.com",
                "0550000000",
                "ID-NO-AUTH",
                "USA");

        mockMvc.perform(post("/api/reservations")
                        .header("Authorization", "Bearer " + guestToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    private Map<String, Object> buildCreateReservationRequest(
            Long roomId,
            String checkInDate,
            String checkOutDate,
            String status,
            String guestName,
            String guestEmail,
            String guestPhone,
            String guestIdNumber,
            String guestNationality) {
        Map<String, Object> guest = new HashMap<>();
        guest.put("name", guestName);
        guest.put("email", guestEmail);
        guest.put("phone", guestPhone);
        guest.put("idNumber", guestIdNumber);
        guest.put("nationality", guestNationality);

        Map<String, Object> request = new HashMap<>();
        request.put("roomId", roomId);
        request.put("checkInDate", checkInDate);
        request.put("checkOutDate", checkOutDate);
        request.put("status", status);
        request.put("guest", guest);
        return request;
    }
}
