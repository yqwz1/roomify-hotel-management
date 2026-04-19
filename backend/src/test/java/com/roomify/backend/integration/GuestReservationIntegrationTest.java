package com.roomify.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * B12 — Integration tests for the Guest Reservation API.
 *
 * Validates:
 *   1. DTO field presence and sort order           (B6 / B7 contract)
 *   2. Empty-list behaviour for guests with no reservations
 *   3. Cross-guest data isolation                  (B10 security hardening)
 *
 * Design decisions:
 * ─────────────────────────────────────────────────────────────────────────────
 * • @SpringBootTest loads the FULL Spring context so the real security filter
 *   chain, real service layer, and real repository layer all run together.
 *   A @WebMvcTest slice would mock the service and bypass B2 identity
 *   resolution, making the tests meaningless from a security perspective.
 *
 * • Auth is JWT-based. The production JwtAuthFilter reads the Authorization
 *   header and populates the SecurityContext from the token's claims.
 *   @WithMockUser bypasses that filter entirely, so it cannot be used here
 *   without defeating the test purpose. Instead we call jwtUtils.generateToken()
 *   and attach the Bearer token just like a real client would.
 *
 * • Data is created fresh in @BeforeEach and cleaned at the start of that
 *   method (not in @AfterEach) so that a test that fails mid-way still leaves
 *   a clean slate for the next run. FK constraints require reservations to be
 *   deleted before guests, and guests before users.
 *
 * • No @Transactional on the class — the JWT filter and MockMvc execute in
 *   different threads / transaction boundaries than the test method itself.
 *   Annotating the class would not roll back data written by the filter chain.
 *   We manage cleanup manually via deleteAll() in @BeforeEach.
 * ─────────────────────────────────────────────────────────────────────────────
 */
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

    // ═══════════════════════════════════════════════════════════════════
    // Injected collaborators
    // ═══════════════════════════════════════════════════════════════════

    @Autowired
    private WebApplicationContext webApplicationContext;

    /** Builds JWT tokens with the same secret used by the production filter. */
    @Autowired
    private JwtUtils jwtUtils;

    /** Used to encode passwords when creating UserEntity records. */
    @Autowired
    private PasswordEncoder passwordEncoder;

    // Repositories — NOT the service; the real service must execute end-to-end.
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    // ─── Runtime state shared across tests ───────────────────────────
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    // JWT tokens — one per guest identity
    private String guestAToken;
    private String guestBToken;

    // Saved entities so tests can inspect IDs / confirmation numbers
    private Guest guestA;
    private Guest guestB;
    private Reservation guestACurrentReservation;
    private Reservation guestAPastReservation;
    private Reservation guestBCurrentReservation;
    private Reservation guestBPastReservation;

    // ═══════════════════════════════════════════════════════════════════
    // Test fixture — runs before EVERY test method
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Rebuilds MockMvc and the complete test dataset before each test.
     *
     * Deletion order (FK-safe):
     *   reservations → rooms → room_types → guests → users
     *
     * Guest entity email MUST match the UserEntity email so that
     * GuestReservationServiceImpl.getGuestReservations() can resolve the
     * authenticated principal (authentication.getName()) to a Guest row via
     * GuestRepository.findByEmailIgnoreCase(email).
     */
    @BeforeEach
    void buildTestData() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // ── Delete in FK-safe order ──────────────────────────────────────
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();
        userRepository.deleteAll();

        // ── Shared room infrastructure ────────────────────────────────────
        RoomType roomType = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("300.00"), 2, "WiFi, TV", "Deluxe room"));

        Room room101 = roomRepository.save(new Room("101", roomType, 1, RoomStatus.AVAILABLE));
        Room room102 = roomRepository.save(new Room("102", roomType, 1, RoomStatus.AVAILABLE));
        Room room201 = roomRepository.save(new Room("201", roomType, 2, RoomStatus.AVAILABLE));
        Room room202 = roomRepository.save(new Room("202", roomType, 2, RoomStatus.AVAILABLE));

        // ── Guest A — UserEntity + GuestEntity + 2 reservations ──────────
        //
        // Step 1: persist the UserEntity so the security layer can authenticate.
        userRepository.save(new User(
                "guestA@test.com",
                passwordEncoder.encode("Password@123"),
                Role.GUEST,
                true));

        // Step 2: persist the GuestEntity.
        //   email MUST equal UserEntity.email — this is the B2 identity link.
        guestA = guestRepository.save(
                new Guest("Guest A", "guestA@test.com", "0500000001", "ID-A-001", "SA"));

        // Step 3: generate a JWT that the security filter will accept.
        guestAToken = jwtUtils.generateToken("guestA@test.com", "ROLE_GUEST");

        // Step 4: two reservations — one current/upcoming, one past.
        guestACurrentReservation = reservationRepository.save(buildReservation(
                guestA, room101,
                LocalDate.now(), LocalDate.now().plusDays(2),
                ReservationStatus.CONFIRMED, "RSV-A-CURRENT"));

        guestAPastReservation = reservationRepository.save(buildReservation(
                guestA, room102,
                LocalDate.now().minusDays(30), LocalDate.now().minusDays(28),
                ReservationStatus.CHECKED_OUT, "RSV-A-PAST"));

        // ── Guest B — same structure, separate data ───────────────────────
        userRepository.save(new User(
                "guestB@test.com",
                passwordEncoder.encode("Password@123"),
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

    // ═══════════════════════════════════════════════════════════════════
    // Test 1 — DTO field presence + B6 sort-order contract
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Verifies that the endpoint returns exactly 2 reservations for guestA,
     * that every required DTO field is present in the response, and that the
     * B6 sort contract holds (current/upcoming before past).
     *
     * Assertion 10 — sort order:
     *   $[0].checkInDate (today) >= $[1].checkInDate (30 days ago)
     *   We assert this in Java by parsing both date arrays from the JSON.
     */
    @Test
    void shouldReturnGuestReservationSummaries() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                // DTO field presence (B7 contract)
                .andExpect(jsonPath("$[0].confirmationNumber").exists())
                .andExpect(jsonPath("$[0].status").exists())
                .andExpect(jsonPath("$[0].checkInDate").exists())
                .andExpect(jsonPath("$[0].checkOutDate").exists())
                .andExpect(jsonPath("$[0].totalPrice").exists())
                // Sort order: current/upcoming first (B6 contract)
                .andExpect(jsonPath("$[0].confirmationNumber").value("RSV-A-CURRENT"))
                .andExpect(jsonPath("$[1].confirmationNumber").value("RSV-A-PAST"))
                .andReturn();

        // Assertion 10 — sort order verified programmatically with date comparison.
        // $[0].checkInDate must be >= $[1].checkInDate (upcoming/current before past).
        String body = result.getResponse().getContentAsString();
        List<Map<String, Object>> reservations = objectMapper.readValue(
                body, new TypeReference<List<Map<String, Object>>>() {});

        // Jackson deserializes LocalDate arrays as [year, month, day] under JavaTimeModule.
        LocalDate firstCheckIn  = parseLocalDateFromList(reservations.get(0).get("checkInDate"));
        LocalDate secondCheckIn = parseLocalDateFromList(reservations.get(1).get("checkInDate"));

        assertFalse(firstCheckIn.isBefore(secondCheckIn),
                "Sort order violated: $[0].checkInDate (" + firstCheckIn
                        + ") must be >= $[1].checkInDate (" + secondCheckIn + ")");
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 2 — Empty list for a guest with no reservations
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Verifies the B6 contract: the endpoint returns HTTP 200 with an empty
     * JSON array [] when the authenticated guest has no reservations.
     *
     * guestC is created here (not in @BeforeEach) because it is only needed
     * by this test. No ReservationEntity is linked to guestC.
     */
    @Test
    void shouldReturnEmptyListWhenNoReservations() throws Exception {
        // Create UserEntity + GuestEntity for guestC — NO reservations.
        userRepository.save(new User(
                "guestC@test.com",
                passwordEncoder.encode("Password@123"),
                Role.GUEST,
                true));

        guestRepository.save(
                new Guest("Guest C", "guestC@test.com", "0500000003", "ID-C-001", "SA"));

        String guestCToken = jwtUtils.generateToken("guestC@test.com", "ROLE_GUEST");

        mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestCToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 3 — Cross-guest data isolation (B10 security hardening proof)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Authenticates as guestA and asserts that NONE of guestB's confirmation
     * numbers appear in the response, and that the list size is exactly 2
     * (guestA's reservation count).
     *
     * Why ObjectMapper instead of jsonPath alone?
     *   jsonPath can only assert individual element values. To prove data
     *   isolation we need to iterate ALL returned items and guarantee that
     *   not a single one belongs to guestB. ObjectMapper lets us parse the
     *   full list into Java objects and do that exhaustive check in a loop.
     *
     * This test proves B10 is working: even though guestB's reservations
     * exist in the database, the service layer (via B2's guest resolution)
     * filters strictly by the authenticated user's guest ID. guestA's token
     * never leaks guestB's data.
     */
    @Test
    void shouldNotReturnOtherGuestsReservations() throws Exception {
        // Collect guestB's confirmation numbers from the entities saved in @BeforeEach.
        Set<String> guestBConfirmationNumbers = Set.of(
                guestBCurrentReservation.getConfirmationNumber(),
                guestBPastReservation.getConfirmationNumber());

        // Call the endpoint authenticating as guestA.
        MvcResult result = mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + guestAToken))
                .andExpect(status().isOk())
                .andReturn();

        // Parse the full response body into a list of maps for programmatic assertion.
        String responseBody = result.getResponse().getContentAsString();
        List<Map<String, Object>> reservations = objectMapper.readValue(
                responseBody, new TypeReference<List<Map<String, Object>>>() {});

        // B10 assertion 1: returned list size == guestA's reservation count (2).
        assertEquals(2, reservations.size(),
                "GuestA should see exactly 2 reservations, not " + reservations.size());

        // B10 assertion 2: none of the returned confirmationNumbers belong to guestB.
        Set<String> returnedConfirmationNumbers = reservations.stream()
                .map(r -> (String) r.get("confirmationNumber"))
                .collect(Collectors.toSet());

        for (String guestBConfirm : guestBConfirmationNumbers) {
            assertFalse(returnedConfirmationNumbers.contains(guestBConfirm),
                    "Data isolation breach: guestA's response must NOT contain guestB's "
                            + "reservation: " + guestBConfirm);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 4 — Role-level access control (B10 complementary check)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Verifies that a MANAGER token is rejected with 403 Forbidden on the
     * guest-only endpoint. Confirms that @PreAuthorize("hasRole('ROLE_GUEST')")
     * on the controller blocks non-guest roles at the HTTP level.
     */
    @Test
    void managerCannotAccessGuestReservationsEndpoint() throws Exception {
        String managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");

        mockMvc.perform(get("/api/guest/reservations")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    // ═══════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Builds a minimal, valid Reservation entity linked to the given guest and room.
     * All non-null fields required by the entity's @PrePersist defaults are set here.
     */
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

    /**
     * Parses a LocalDate that Jackson deserialises as either:
     *   - a List  [year, month, day]   (with JavaTimeModule in array mode), or
     *   - a String "YYYY-MM-DD"        (with JavaTimeModule in ISO mode).
     *
     * Both representations are possible depending on ObjectMapper configuration,
     * so we handle both to keep the assertion robust.
     */
    @SuppressWarnings("unchecked")
    private LocalDate parseLocalDateFromList(Object raw) {
        if (raw instanceof List) {
            List<Integer> parts = (List<Integer>) raw;
            return LocalDate.of(parts.get(0), parts.get(1), parts.get(2));
        }
        // Fallback: ISO-8601 string "YYYY-MM-DD"
        return LocalDate.parse(raw.toString());
    }
}
