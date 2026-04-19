package com.roomify.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:guestreservationdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000",
        "roomify.billing.vat-rate=0.15"
})
class GuestReservationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String guestToken;
    private String managerToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");
        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");

        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();
    }

    @Test
    void guestReservationsReturnsEmptyArrayWhenGuestHasNoReservations() throws Exception {
        guestRepository.save(new Guest("Guest User", "guest@roomify.com", "0500000000", "ID-GUEST-001", "SA"));

        String response = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertTrue(json.isArray());
        assertEquals(0, json.size());
    }

    @Test
    void guestReservationsReturnsOnlyAuthenticatedGuestsReservationsSortedByProductRules() throws Exception {
        Guest guest = guestRepository.save(
                new Guest("Guest User", "guest@roomify.com", "0500000000", "ID-GUEST-001", "SA"));
        Guest otherGuest = guestRepository.save(
                new Guest("Other Guest", "other@roomify.com", "0500000001", "ID-GUEST-002", "SA"));

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("200.00"), 2, "WiFi, TV", "Deluxe room"));
        Room room101 = roomRepository.save(new Room("101", roomType, 1, RoomStatus.AVAILABLE));
        Room room102 = roomRepository.save(new Room("102", roomType, 1, RoomStatus.AVAILABLE));
        Room room103 = roomRepository.save(new Room("103", roomType, 1, RoomStatus.AVAILABLE));
        Room room104 = roomRepository.save(new Room("104", roomType, 1, RoomStatus.AVAILABLE));
        Room room105 = roomRepository.save(new Room("105", roomType, 1, RoomStatus.AVAILABLE));

        reservationRepository.save(buildReservation(
                guest,
                room101,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(1),
                "RSV-CURRENT-001"));
        reservationRepository.save(buildReservation(
                guest,
                room102,
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(7),
                "RSV-UPCOMING-001"));
        reservationRepository.save(buildReservation(
                guest,
                room103,
                LocalDate.now().minusDays(4),
                LocalDate.now().minusDays(2),
                "RSV-PAST-RECENT"));
        reservationRepository.save(buildReservation(
                guest,
                room104,
                LocalDate.now().minusDays(20),
                LocalDate.now().minusDays(18),
                "RSV-PAST-OLDER"));
        reservationRepository.save(buildReservation(
                otherGuest,
                room105,
                LocalDate.now().plusDays(3),
                LocalDate.now().plusDays(4),
                "RSV-OTHER-GUEST"));

        String response = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertEquals("RSV-CURRENT-001", json.get(0).get("confirmationNumber").asText());
        assertEquals("RSV-CURRENT-001", json.get(0).get("confirmation").asText());
        assertEquals("RSV-UPCOMING-001", json.get(1).get("confirmationNumber").asText());
        assertEquals("RSV-PAST-RECENT", json.get(2).get("confirmationNumber").asText());
        assertEquals("RSV-PAST-OLDER", json.get(3).get("confirmationNumber").asText());
        assertEquals("101", json.get(0).get("roomNumber").asText());
        assertEquals("Deluxe", json.get(0).get("roomType").asText());
        assertEquals("Deluxe", json.get(0).get("roomTypeName").asText());
        assertEquals("PENDING", json.get(0).get("paymentStatus").asText());
        assertEquals(0, new BigDecimal("200.00").compareTo(new BigDecimal(json.get(0).get("totalAmount").asText())));
        assertEquals(0, new BigDecimal("200.00").compareTo(new BigDecimal(json.get(0).get("totalPrice").asText())));
    }

    @Test
    void managerCannotAccessGuestReservationsEndpoint() throws Exception {
        mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void guestReservationsMergeCaseVariantGuestProfilesAndTrimAuthenticatedEmail() throws Exception {
        String paddedGuestToken = jwtUtils.generateToken("  GUEST@roomify.com  ", "ROLE_GUEST");

        Guest primaryGuest = guestRepository.save(
                new Guest("Guest User", "guest@roomify.com", "0500000000", "ID-GUEST-PRIMARY", "SA"));
        Guest legacyCaseVariantGuest = guestRepository.save(
                new Guest("Guest User Legacy", "GUEST@ROOMIFY.COM", "0500000001", "ID-GUEST-LEGACY", "SA"));
        Guest otherGuest = guestRepository.save(
                new Guest("Other Guest", "other@roomify.com", "0500000002", "ID-GUEST-OTHER", "SA"));

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Suite", new BigDecimal("300.00"), 2, "WiFi, TV", "Suite room"));
        Room room201 = roomRepository.save(new Room("201", roomType, 2, RoomStatus.AVAILABLE));
        Room room202 = roomRepository.save(new Room("202", roomType, 2, RoomStatus.AVAILABLE));
        Room room203 = roomRepository.save(new Room("203", roomType, 2, RoomStatus.AVAILABLE));

        reservationRepository.save(buildReservation(
                primaryGuest,
                room201,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(4),
                "RSV-PRIMARY-001"));
        reservationRepository.save(buildReservation(
                legacyCaseVariantGuest,
                room202,
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(7),
                "RSV-LEGACY-001"));
        reservationRepository.save(buildReservation(
                otherGuest,
                room203,
                LocalDate.now().plusDays(8),
                LocalDate.now().plusDays(10),
                "RSV-OTHER-001"));

        String response = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + paddedGuestToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertEquals("RSV-PRIMARY-001", json.get(0).get("confirmationNumber").asText());
        assertEquals("RSV-PRIMARY-001", json.get(0).get("confirmation").asText());
        assertEquals("RSV-LEGACY-001", json.get(1).get("confirmationNumber").asText());
        assertEquals("RSV-LEGACY-001", json.get(1).get("confirmation").asText());
    }

    private Reservation buildReservation(
            Guest guest,
            Room room,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            String confirmationNumber) {
        Reservation reservation = new Reservation(
                guest,
                room,
                checkInDate,
                checkOutDate,
                new BigDecimal("200.00"),
                ReservationStatus.CONFIRMED,
                confirmationNumber);
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setInvoiceFinalized(false);
        return reservation;
    }
}
