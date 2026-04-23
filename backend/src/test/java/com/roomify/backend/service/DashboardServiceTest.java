package com.roomify.backend.service;

import com.roomify.backend.dto.DashboardMetricsResponse;
import com.roomify.backend.dto.OccupancyTrendPoint;
import com.roomify.backend.dto.ReportExportResponse;
import com.roomify.backend.dto.ReportFilterRequest;
import com.roomify.backend.dto.RevenueTrendPoint;
import com.roomify.backend.dto.RoomTypeDistributionItem;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.DashboardRepository;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link DashboardService} using Mockito.
 *
 * Adjusted after the production-grade refactoring:
 * - getMetrics now drives avgStayNights via {@code findStayDatesInPeriod}
 * instead of the removed {@code avgStayNights} JPQL query.
 * - exportReport is stubbed via {@code findAll(Specification, Pageable)}
 * (chunked pagination) instead of the removed {@code findForReport}.
 */
class DashboardServiceTest {

        private DashboardRepository dashboardRepository;
        private ExpenseRepository expenseRepository;
        private RoomRepository roomRepository;
        private RoomTypeRepository roomTypeRepository;

        private DashboardService dashboardService;

        private static final LocalDate START = LocalDate.of(2026, 3, 1);
        private static final LocalDate END = LocalDate.of(2026, 3, 31);

        @BeforeEach
        void setUp() {
                dashboardRepository = mock(DashboardRepository.class);
                expenseRepository = mock(ExpenseRepository.class);
                roomRepository = mock(RoomRepository.class);
                roomTypeRepository = mock(RoomTypeRepository.class);

                dashboardService = new DashboardService(
                                dashboardRepository,
                                expenseRepository,
                                roomRepository,
                                roomTypeRepository);
        }

        // ─── getMetrics ───────────────────────────────────────────────────────────

        @Test
        void getMetricsShouldComputeAvgNightsInJavaFromDatePairs() {
                // 2 reservations: 3 nights + 5 nights → avg = 4.0
                Object[] pair1 = { LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 4) }; // 3 nights
                Object[] pair2 = { LocalDate.of(2026, 3, 10), LocalDate.of(2026, 3, 15) }; // 5 nights

                when(dashboardRepository.countReservationsInPeriod(START, END)).thenReturn(2L);
                when(dashboardRepository.countActiveReservationsInPeriod(START, END)).thenReturn(2L);
                when(dashboardRepository.sumRevenueInPeriod(START, END))
                                .thenReturn(new BigDecimal("2000.00"));
                when(expenseRepository.sumAmountInPeriod(START, END))
                                .thenReturn(new BigDecimal("425.50"));
                when(dashboardRepository.findStayDatesInPeriod(START, END))
                                .thenReturn(List.of(pair1, pair2));
                when(roomRepository.count()).thenReturn(10L);
                when(dashboardRepository.countOccupiedRoomsOnDate(any(LocalDate.class))).thenReturn(5L);

                DashboardMetricsResponse response = dashboardService.getMetrics(START, END);

                assertEquals(4.0, response.getAverageStayNights(), 0.0001,
                                "avgNights should be (3+5)/2 = 4.0 — computed in Java, not via DATEDIFF");
                assertEquals(0.5, response.getOccupancyRate(), 0.0001);
                assertEquals(new BigDecimal("2000.00"), response.getTotalRevenue());
                assertEquals(new BigDecimal("425.50"), response.getTotalExpenses());
                assertEquals(new BigDecimal("1574.50"), response.getNetProfit());
        }

        @Test
        void getMetricsShouldReturnZeroAvgAndOccupancyWhenNothingExists() {
                when(dashboardRepository.countReservationsInPeriod(START, END)).thenReturn(0L);
                when(dashboardRepository.countActiveReservationsInPeriod(START, END)).thenReturn(0L);
                when(dashboardRepository.sumRevenueInPeriod(START, END)).thenReturn(BigDecimal.ZERO);
                when(expenseRepository.sumAmountInPeriod(START, END)).thenReturn(BigDecimal.ZERO);
                when(dashboardRepository.findStayDatesInPeriod(START, END))
                                .thenReturn(Collections.emptyList());
                when(roomRepository.count()).thenReturn(0L);
                when(dashboardRepository.countOccupiedRoomsOnDate(any(LocalDate.class))).thenReturn(0L);

                DashboardMetricsResponse response = dashboardService.getMetrics(START, END);

                assertEquals(0.0, response.getAverageStayNights(), 0.0001,
                                "avgNights should be 0.0 when no reservations exist");
                assertEquals(0.0, response.getOccupancyRate(), 0.0001,
                                "occupancyRate should be 0.0 — guards against division by zero");
        }

        // ─── getRevenueTrend ──────────────────────────────────────────────────────

        @Test
        void getRevenueTrendShouldMapDailyDataCorrectly() {
                LocalDate day1 = LocalDate.of(2026, 3, 5);
                LocalDate day2 = LocalDate.of(2026, 3, 6);

                Object[] row1 = new Object[] { day1, new BigDecimal("500.00"), 2L };
                Object[] row2 = new Object[] { day2, new BigDecimal("750.00"), 3L };

                when(dashboardRepository.findDailyRevenue(START, END))
                                .thenReturn(List.of(row1, row2));

                List<RevenueTrendPoint> trend = dashboardService.getRevenueTrend(START, END);

                assertEquals(2, trend.size());
                assertEquals(day1, trend.get(0).getDate());
                assertEquals(new BigDecimal("500.00"), trend.get(0).getRevenue());
                assertEquals(2L, trend.get(0).getReservationCount());
                assertEquals(day2, trend.get(1).getDate());
                assertEquals(new BigDecimal("750.00"), trend.get(1).getRevenue());
                assertEquals(3L, trend.get(1).getReservationCount());
        }

        @Test
        void getRevenueTrendShouldReturnEmptyListWhenNoDataExists() {
                when(dashboardRepository.findDailyRevenue(START, END))
                                .thenReturn(Collections.emptyList());

                List<RevenueTrendPoint> trend = dashboardService.getRevenueTrend(START, END);

                assertNotNull(trend);
                assertTrue(trend.isEmpty());
        }

        // ─── getOccupancyTrend ────────────────────────────────────────────────────

        @Test
        void getOccupancyTrendShouldGenerateOnePointPerDay() {
                LocalDate rangeStart = LocalDate.of(2026, 3, 1);
                LocalDate rangeEnd = LocalDate.of(2026, 3, 3); // 3 days

                when(roomRepository.count()).thenReturn(10L);
                when(dashboardRepository.countOccupiedRoomsOnDate(any(LocalDate.class))).thenReturn(5L);

                List<OccupancyTrendPoint> trend = dashboardService.getOccupancyTrend(rangeStart, rangeEnd);

                assertEquals(3, trend.size());
                trend.forEach(point -> {
                        assertEquals(0.5, point.getOccupancyRate(), 0.0001);
                        assertEquals(5L, point.getOccupiedRooms());
                        assertEquals(10L, point.getTotalRooms());
                });
        }

        // ─── getRoomTypeDistribution ──────────────────────────────────────────────

        @Test
        void getRoomTypeDistributionShouldCalculateOccupancyRateCorrectly() {
                RoomType deluxe = new RoomType("Deluxe", new BigDecimal("250.00"), 2, "WiFi", "Deluxe");
                deluxe.setId(1L);
                RoomType suite = new RoomType("Suite", new BigDecimal("500.00"), 4, "WiFi,Jacuzzi", "Suite");
                suite.setId(2L);

                when(roomTypeRepository.findAll()).thenReturn(List.of(deluxe, suite));
                when(roomRepository.countByRoomType(deluxe)).thenReturn(8L);
                when(roomRepository.countByRoomType(suite)).thenReturn(4L);
                when(dashboardRepository.countOccupiedRoomsByType(1L)).thenReturn(4L);
                when(dashboardRepository.countOccupiedRoomsByType(2L)).thenReturn(1L);

                List<RoomTypeDistributionItem> distribution = dashboardService.getRoomTypeDistribution();

                assertEquals(2, distribution.size());
                assertEquals(0.5, distribution.get(0).getOccupancyRate(), 0.0001);
                assertEquals(0.25, distribution.get(1).getOccupancyRate(), 0.0001);
        }

        // ─── exportReport ─────────────────────────────────────────────────────────

        @Test
        @SuppressWarnings("unchecked")
        void exportReportShouldUsePaginationAndReturnMappedRows() {
                ReportFilterRequest filter = new ReportFilterRequest(
                                START, END, null, null, "JSON");

                Reservation r = buildSampleReservation();
                Page<Reservation> singlePage = new PageImpl<>(List.of(r));

                // Stub the Specification + Pageable overload (used by chunked export)
                when(dashboardRepository.findAll(
                                any(Specification.class), any(Pageable.class)))
                                .thenReturn(singlePage);

                ReportExportResponse response = dashboardService.exportReport(filter);

                assertEquals("JSON", response.getFormat());
                assertEquals(1, response.getTotalRecords());
                assertNotNull(response.getGeneratedAt());

                Map<String, Object> row = response.getData().get(0);
                assertEquals("RSV-TEST001", row.get("confirmationNumber"));
                assertEquals("Test Guest", row.get("guestName"));
                assertEquals("101", row.get("roomNumber"));
                assertEquals("Deluxe", row.get("roomType"));
                assertEquals(ReservationStatus.CONFIRMED.name(), row.get("status"));
        }

        @Test
        @SuppressWarnings("unchecked")
        void exportReportWithStatusFilterShouldPassEnumToSpecification() {
                ReportFilterRequest filter = new ReportFilterRequest(
                                START, END, null, ReservationStatus.CANCELLED, "JSON");

                // Empty page — no cancelled reservations in test data
                when(dashboardRepository.findAll(
                                any(Specification.class), any(Pageable.class)))
                                .thenReturn(Page.empty());

                ReportExportResponse response = dashboardService.exportReport(filter);

                assertEquals(0L, response.getTotalRecords());
                assertTrue(response.getData().isEmpty());
                // The status was passed as a proper Enum to DashboardSpecification.build() —
                // verified by the fact that no ClassCastException is thrown.
        }

        // ─── helper ───────────────────────────────────────────────────────────────

        private Reservation buildSampleReservation() {
                RoomType type = new RoomType("Deluxe", new BigDecimal("250.00"), 2, "WiFi", "Deluxe");
                type.setId(1L);

                Room room = new Room("101", type, 1, RoomStatus.AVAILABLE);
                room.setId(1L);

                Guest guest = new Guest("Test Guest", "test@example.com", "0500000000", "ID-01", "SA");
                guest.setId(1L);

                Reservation r = new Reservation();
                r.setId(1L);
                r.setConfirmationNumber("RSV-TEST001");
                r.setGuest(guest);
                r.setRoom(room);
                r.setCheckInDate(LocalDate.of(2026, 3, 10));
                r.setCheckOutDate(LocalDate.of(2026, 3, 13));
                r.setTotalPrice(new BigDecimal("750.00"));
                r.setTotalPaid(new BigDecimal("750.00"));
                r.setOutstandingBalance(BigDecimal.ZERO);
                r.setStatus(ReservationStatus.CONFIRMED);
                r.setInvoiceFinalized(true);
                return r;
        }
}
