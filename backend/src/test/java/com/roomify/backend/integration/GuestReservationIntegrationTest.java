package com.roomify.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestConfig.class)
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:guestreservationdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
                "spring.datasource.driverClassName=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
                "roomify.jwt.expiration=3600000",
                "roomify.billing.vat-rate=0.15"
        }
)
@ActiveProfiles("test")
class GuestReservationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    private MockMvc mockMvc;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    private ObjectMapper objectMapper;

    private Guest guestA;
    private Guest guestB;
    private Reservation guestBCurrentReservation;
    private Reservation guestBPastReservation;

    private String guestAToken;
    private String guestBToken;

    @BeforeEach
    void buildTestData() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();
        userRepository.deleteAll();

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("300.00"), 2, "WiFi, TV", "Deluxe room"));

        Room room101 = roomRepository.save(new Room("101", roomType, 1, RoomStatus.AVAILABLE));
        Room room102 = roomRepository.save(new Room("102", roomType, 1, RoomStatus.AVAILABLE));
        Room room201 = roomRepository.save(new Room("201", roomType, 2, RoomStatus.AVAILABLE));
        Room room202 = roomRepository.save(new Room("202", roomType, 2, RoomStatus.AVAILABLE));

        userRepository.save(new User(
                "guestA@test.com",
                "encodedPassword",
                Role.GUEST,
                true));

        guestA = guestRepository.save(
                new Guest("Guest A", "guestA@test.com", "0500000001", "ID-A-001", "SA"));

        guestAToken = jwtUtils.generateToken("guestA@test.com", "ROLE_GUEST");

        reservationRepository.save(buildReservation(
                guestA, room101,
                LocalDate.now(), LocalDate.now().plusDays(2),
                ReservationStatus.CONFIRMED, "RSV-A-CURRENT"));

        reservationRepository.save(buildReservation(
                guestA, room102,
                LocalDate.now().minusDays(30), LocalDate.now().minusDays(28),
                ReservationStatus.CHECKED_OUT, "RSV-A-PAST"));

        userRepository.save(new User(
                "guestB@test.com",
                "encodedPassword",
                Role.GUEST,
                true));

        guestB = guestRepository.save(
                new Guest("Guest B", "guestB@test.com", "0500000002", "ID-B-001", "SA"));

        guestBToken = jwtUtils.generateToken("guestB@test.com", "ROLE_GUEST");

        guestBCurrentReservation = reservationRepository.save(buildReservation(
                guestB, room201,
                LocalDate.now(), LocalDate.now().plusDays(3),
                ReservationStatus.CONFIRMED, "RSV-B-CURRENT"));

        guestBPastReservation = reservationRepository.save(buildReservation(
                guestB, room202,
                LocalDate.now().minusDays(15), LocalDate.now().minusDays(13),
                ReservationStatus.CHECKED_OUT, "RSV-B-PAST"));
    }

    @Test
    void shouldReturnGuestReservationSummaries() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].confirmationNumber").exists())
                .andExpect(jsonPath("$[0].status").exists())
                .andExpect(jsonPath("$[0].checkInDate").exists())
                .andExpect(jsonPath("$[0].checkOutDate").exists())
                .andExpect(jsonPath("$[0].totalPrice").exists())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        List<Map<String, Object>> reservations = objectMapper.readValue(
                body, new TypeReference<List<Map<String, Object>>>() {});

        LocalDate firstCheckIn = parseLocalDateFromList(reservations.get(0).get("checkInDate"));
        LocalDate secondCheckIn = parseLocalDateFromList(reservations.get(1).get("checkInDate"));

        assertFalse(firstCheckIn.isBefore(secondCheckIn));
    }

    @Test
    void shouldReturnEmptyListWhenNoReservations() throws Exception {
        userRepository.save(new User(
                "guestC@test.com",
                "encodedPassword",
                Role.GUEST,
                true));

        guestRepository.save(
                new Guest("Guest C", "guestC@test.com", "0500000003", "ID-C-001", "SA"));

        String guestCToken = jwtUtils.generateToken("guestC@test.com", "ROLE_GUEST");

        String response = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestCToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertEquals(0, json.size());
    }

    @Test
    void shouldNotReturnOtherGuestsReservations() throws Exception {
        Set<String> guestBConfirmationNumbers = Set.of(
                guestBCurrentReservation.getConfirmationNumber(),
                guestBPastReservation.getConfirmationNumber());

        MvcResult result = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestAToken))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        List<Map<String, Object>> reservations = objectMapper.readValue(
                responseBody, new TypeReference<List<Map<String, Object>>>() {});

        assertEquals(2, reservations.size());

        Set<String> returnedConfirmationNumbers = reservations.stream()
                .map(r -> (String) r.get("confirmationNumber"))
                .collect(Collectors.toSet());

        for (String guestBConfirm : guestBConfirmationNumbers) {
            assertFalse(returnedConfirmationNumbers.contains(guestBConfirm));
        }
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
        Room room301 = roomRepository.save(new Room("301", roomType, 3, RoomStatus.AVAILABLE));
        Room room302 = roomRepository.save(new Room("302", roomType, 3, RoomStatus.AVAILABLE));
        Room room303 = roomRepository.save(new Room("303", roomType, 3, RoomStatus.AVAILABLE));

        reservationRepository.save(buildReservation(
                primaryGuest,
                room301,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(4),
                ReservationStatus.CONFIRMED,
                "RSV-PRIMARY-001"));
        reservationRepository.save(buildReservation(
                legacyCaseVariantGuest,
                room302,
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(7),
                ReservationStatus.CONFIRMED,
                "RSV-LEGACY-001"));
        reservationRepository.save(buildReservation(
                otherGuest,
                room303,
                LocalDate.now().plusDays(8),
                LocalDate.now().plusDays(10),
                ReservationStatus.CONFIRMED,
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
        assertEquals("Suite", json.get(0).get("roomTypeName").asText());
        assertEquals("Suite", json.get(0).get("roomType").asText());
        assertEquals("RSV-LEGACY-001", json.get(1).get("confirmationNumber").asText());
        assertEquals("RSV-LEGACY-001", json.get(1).get("confirmation").asText());
    }

    private Reservation buildReservation(
            Guest guest,
            Room room,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            ReservationStatus status,
            String confirmationNumber) {

        Reservation reservation = new Reservation(
                guest, room, checkInDate, checkOutDate,
                new BigDecimal("300.00"), status, confirmationNumber);
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(new BigDecimal("300.00"));
        reservation.setInvoiceFinalized(false);
        return reservation;
    }

    @SuppressWarnings("unchecked")
    private LocalDate parseLocalDateFromList(Object raw) {
        if (raw instanceof List) {
            List<Integer> parts = (List<Integer>) raw;
            return LocalDate.of(parts.get(0), parts.get(1), parts.get(2));
        }
        return LocalDate.parse(raw.toString());
    }
}
