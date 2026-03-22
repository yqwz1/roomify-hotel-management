package com.roomify.backend.repository;

import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration tests for {@link DashboardRepository} JPQL queries and
 * {@link DashboardSpecification} predicates.
 *
 * Uses the project's standard integration test pattern:
 * {@code @SpringBootTest} with an in-memory H2 database (MODE=PostgreSQL)
 * and {@code @Transactional} for automatic per-test rollback.
 *
 * These tests actually execute the JPQL/Criteria queries, verifying:
 * <ul>
 *   <li>Query syntax correctness against the real entity schema.</li>
 *   <li>The portable {@code findStayDatesInPeriod} (replaces DATEDIFF).</li>
 *   <li>Type-safe Enum filtering via {@link DashboardSpecification}.</li>
 * </ul>
 */
@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dashboardrepotest;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
@Transactional
class DashboardRepositoryTest {

    @Autowired private DashboardRepository dashboardRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private RoomTypeRepository roomTypeRepository;
    @Autowired private GuestRepository guestRepository;

    private static final LocalDate PERIOD_START = LocalDate.of(2026, 3, 1);
    private static final LocalDate PERIOD_END   = LocalDate.of(2026, 3, 31);

    private RoomType deluxeType;
    private Room room101;
    private Room room102;
    private Guest guestA;
    private Guest guestB;

    @BeforeEach
    void setUp() {
        dashboardRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();

        deluxeType = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("200.00"), 2, "WiFi", "Deluxe room"));
        room101 = roomRepository.save(new Room("101", deluxeType, 1, RoomStatus.AVAILABLE));
        room102 = roomRepository.save(new Room("102", deluxeType, 1, RoomStatus.AVAILABLE));
        guestA  = guestRepository.save(new Guest("Alice", "alice@test.com", "0501000001", "ID-AA", "SA"));
        guestB  = guestRepository.save(new Guest("Bob",   "bob@test.com",   "0501000002", "ID-BB", "SA"));
    }

    // ─── countReservationsInPeriod ────────────────────────────────────────────

    @Test
    void countReservationsInPeriodShouldCountAllStatusesInRange() {
        save("RSV-001", room101, guestA, "2026-03-05", "2026-03-08", ReservationStatus.CONFIRMED, "600.00");
        save("RSV-002", room102, guestB, "2026-03-10", "2026-03-12", ReservationStatus.CANCELLED, "400.00");

        assertEquals(2L, dashboardRepository.countReservationsInPeriod(PERIOD_START, PERIOD_END));
    }

    @Test
    void countReservationsInPeriodShouldExcludeOutsideRange() {
        save("RSV-OUT", room101, guestA, "2026-02-15", "2026-02-18", ReservationStatus.CONFIRMED, "600.00");

        assertEquals(0L, dashboardRepository.countReservationsInPeriod(PERIOD_START, PERIOD_END),
                "Reservation outside the period must not be counted");
    }

    // ─── countActiveReservationsInPeriod ──────────────────────────────────────

    @Test
    void countActiveReservationsInPeriodShouldExcludeCancelledAndPending() {
        save("RSV-ACT1", room101, guestA, "2026-03-05", "2026-03-08", ReservationStatus.CONFIRMED,  "600.00");
        save("RSV-ACT2", room102, guestB, "2026-03-10", "2026-03-12", ReservationStatus.CHECKED_IN, "400.00");
        save("RSV-ACT3", room101, guestB, "2026-03-15", "2026-03-17", ReservationStatus.CANCELLED,  "250.00");
        save("RSV-ACT4", room102, guestA, "2026-03-20", "2026-03-22", ReservationStatus.PENDING,    "300.00");

        assertEquals(2L, dashboardRepository.countActiveReservationsInPeriod(PERIOD_START, PERIOD_END),
                "Only CONFIRMED + CHECKED_IN should be counted");
    }

    // ─── sumRevenueInPeriod ───────────────────────────────────────────────────

    @Test
    void sumRevenueInPeriodShouldExcludeCancelledReservations() {
        save("RSV-REV1", room101, guestA, "2026-03-05", "2026-03-08", ReservationStatus.CHECKED_OUT, "600.00");
        save("RSV-REV2", room102, guestB, "2026-03-10", "2026-03-12", ReservationStatus.CANCELLED,   "400.00");

        BigDecimal revenue = dashboardRepository.sumRevenueInPeriod(PERIOD_START, PERIOD_END);
        assertEquals(0, new BigDecimal("600.00").compareTo(revenue),
                "Cancelled reservations must be excluded from revenue");
    }

    // ─── findStayDatesInPeriod (replaces DATEDIFF) ────────────────────────────

    @Test
    void findStayDatesInPeriodShouldReturnPortableDatePairsForJavaAvgCalculation() {
        save("RSV-D1", room101, guestA, "2026-03-01", "2026-03-04",  ReservationStatus.CONFIRMED,  "600.00");  // 3 nights
        save("RSV-D2", room102, guestB, "2026-03-10", "2026-03-15",  ReservationStatus.CHECKED_OUT,"1000.00"); // 5 nights
        save("RSV-D3", room101, guestB, "2026-03-20", "2026-03-22",  ReservationStatus.CANCELLED,  "400.00");  // excluded

        List<Object[]> pairs = dashboardRepository.findStayDatesInPeriod(PERIOD_START, PERIOD_END);
        assertEquals(2, pairs.size(), "Cancelled must be excluded");

        // Verify Java-based avg calculation on the returned date pairs
        long totalNights = pairs.stream()
                .mapToLong(row -> ChronoUnit.DAYS.between((LocalDate) row[0], (LocalDate) row[1]))
                .sum();
        assertEquals(8L, totalNights, "3 + 5 = 8 total nights");
        assertEquals(4.0, (double) totalNights / pairs.size(), 0.0001, "avg = 4.0");
    }

    // ─── countOccupiedRoomsOnDate ─────────────────────────────────────────────

    @Test
    void countOccupiedRoomsOnDateShouldCountCheckedInSpanningDate() {
        save("RSV-OCC", room101, guestA, "2026-03-05", "2026-03-10", ReservationStatus.CHECKED_IN, "1000.00");

        assertEquals(1L, dashboardRepository.countOccupiedRoomsOnDate(LocalDate.of(2026, 3, 7)));
    }

    @Test
    void countOccupiedRoomsOnDateShouldNotCountOnCheckOutDay() {
        save("RSV-CO", room101, guestA, "2026-03-05", "2026-03-10", ReservationStatus.CHECKED_IN, "1000.00");

        assertEquals(0L, dashboardRepository.countOccupiedRoomsOnDate(LocalDate.of(2026, 3, 10)),
                "checkOut day should not be counted as occupied (strictly less-than)");
    }

    // ─── DashboardSpecification (Criteria API — Enum type-safe filter) ────────

    @Test
    void specificationShouldFilterByStatusEnumTypeSafe() {
        save("RSV-SP1", room101, guestA, "2026-03-05", "2026-03-08", ReservationStatus.CONFIRMED,  "600.00");
        save("RSV-SP2", room102, guestB, "2026-03-10", "2026-03-12", ReservationStatus.CANCELLED,  "400.00");

        // Status passed as proper Enum — no String cast
        Specification<Reservation> spec = DashboardSpecification.build(
                PERIOD_START, PERIOD_END, ReservationStatus.CONFIRMED, null);

        Page<Reservation> result = dashboardRepository.findAll(
                spec, PageRequest.of(0, 50, Sort.by("checkInDate")));

        assertEquals(1L, result.getTotalElements());
        assertEquals("RSV-SP1", result.getContent().get(0).getConfirmationNumber());
    }

    @Test
    void specificationWithNullStatusShouldReturnAllStatuses() {
        save("RSV-ALL1", room101, guestA, "2026-03-05", "2026-03-08", ReservationStatus.CONFIRMED, "600.00");
        save("RSV-ALL2", room102, guestB, "2026-03-10", "2026-03-12", ReservationStatus.CANCELLED, "400.00");

        Specification<Reservation> spec = DashboardSpecification.build(
                PERIOD_START, PERIOD_END, null, null);

        Page<Reservation> result = dashboardRepository.findAll(
                spec, PageRequest.of(0, 50, Sort.by("checkInDate")));

        assertEquals(2L, result.getTotalElements(),
                "Null status must return all statuses");
    }

    @Test
    void specificationShouldFilterByRoomTypeId() {
        RoomType suiteType = roomTypeRepository.save(
                new RoomType("Suite", new BigDecimal("500.00"), 4, "Jacuzzi", "Suite"));
        Room suiteRoom = roomRepository.save(new Room("201", suiteType, 2, RoomStatus.AVAILABLE));

        save("RSV-DLX", room101,    guestA, "2026-03-05", "2026-03-08", ReservationStatus.CONFIRMED, "600.00");
        save("RSV-STE", suiteRoom,  guestB, "2026-03-05", "2026-03-08", ReservationStatus.CONFIRMED, "1500.00");

        Specification<Reservation> spec = DashboardSpecification.build(
                PERIOD_START, PERIOD_END, null, deluxeType.getId());

        Page<Reservation> result = dashboardRepository.findAll(
                spec, PageRequest.of(0, 50, Sort.by("checkInDate")));

        assertEquals(1L, result.getTotalElements(),
                "Filter by roomTypeId must return only Deluxe reservations");
        assertEquals("RSV-DLX", result.getContent().get(0).getConfirmationNumber());
    }

    // ─── findDailyRevenue ─────────────────────────────────────────────────────

    @Test
    void findDailyRevenueShouldGroupByCheckInDateAndExcludeCancelled() {
        save("RSV-DR1", room101, guestA, "2026-03-05", "2026-03-08", ReservationStatus.CHECKED_OUT, "600.00");
        save("RSV-DR2", room102, guestB, "2026-03-05", "2026-03-10", ReservationStatus.CONFIRMED,   "400.00");
        save("RSV-DR3", room101, guestB, "2026-03-05", "2026-03-07", ReservationStatus.CANCELLED,   "999.00"); // excluded

        List<Object[]> rows = dashboardRepository.findDailyRevenue(PERIOD_START, PERIOD_END);

        assertEquals(1, rows.size(), "Only 1 date group (March 5) after excluding cancelled");
        assertEquals(LocalDate.of(2026, 3, 5), rows.get(0)[0]);
        assertTrue(((BigDecimal) rows.get(0)[1]).compareTo(new BigDecimal("1000.00")) == 0,
                "Revenue for March 5 should be 600 + 400 = 1000");
        assertEquals(2L, ((Number) rows.get(0)[2]).longValue());
    }

    // ─── helper ───────────────────────────────────────────────────────────────

    private void save(String confirmationNumber, Room room, Guest guest,
                      String checkIn, String checkOut,
                      ReservationStatus status, String totalPrice) {
        Reservation r = new Reservation(
                guest, room,
                LocalDate.parse(checkIn), LocalDate.parse(checkOut),
                new BigDecimal(totalPrice), status, confirmationNumber);
        r.setTotalPaid(BigDecimal.ZERO);
        r.setOutstandingBalance(new BigDecimal(totalPrice));
        dashboardRepository.save(r);
    }
}
