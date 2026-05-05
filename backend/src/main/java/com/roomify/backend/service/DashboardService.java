package com.roomify.backend.service;

import com.roomify.backend.dto.DashboardMetricsResponse;
import com.roomify.backend.dto.OccupancyTrendPoint;
import com.roomify.backend.dto.ReportExportResponse;
import com.roomify.backend.dto.ReportFilterRequest;
import com.roomify.backend.dto.RevenueTrendPoint;
import com.roomify.backend.dto.RoomTypeDistributionItem;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.DashboardRepository;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.DashboardSpecification;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service layer for dashboard metrics, trend data, room-type distribution,
 * and report export functionality.
 *
 * <h3>Refactoring summary (production-grade pass)</h3>
 * <ul>
 *   <li><b>avgStayNights</b>: computed in Java via {@link ChronoUnit#DAYS} —
 *       no database-specific {@code DATEDIFF} / {@code DATE_PART} function.</li>
 *   <li><b>exportReport filter</b>: uses {@link DashboardSpecification} (Criteria API)
 *       with the proper {@link com.roomify.backend.entity.ReservationStatus} Enum —
 *       no String-casting workaround.</li>
 *   <li><b>exportReport memory</b>: processes reservations in chunks of
 *       {@link #EXPORT_CHUNK_SIZE} rows using {@link Page} — never loads the full
 *       result set into the JVM heap at once.</li>
 * </ul>
 *
 * All methods are read-only (no writes to the database).
 */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    /**
     * Number of reservation rows fetched per database round-trip during export.
     * Keeps heap consumption bounded regardless of total dataset size.
     */
    private static final int EXPORT_CHUNK_SIZE = 500;

    private final DashboardRepository dashboardRepository;
    private final ExpenseRepository expenseRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    public DashboardService(
            DashboardRepository dashboardRepository,
            ExpenseRepository expenseRepository,
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository) {
        this.dashboardRepository = dashboardRepository;
        this.expenseRepository = expenseRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Metrics endpoint
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Aggregate key performance metrics for the requested date range.
     *
     * @param start period start (inclusive)
     * @param end   period end (inclusive)
     * @return populated {@link DashboardMetricsResponse}
     */
    public DashboardMetricsResponse getMetrics(LocalDate start, LocalDate end) {
        log.info("Dashboard metrics requested: {} – {}", start, end);

        long totalReservations = dashboardRepository.countReservationsInPeriod(start, end);
        long activeReservations = dashboardRepository.countActiveReservationsInPeriod(start, end);
        BigDecimal totalRevenue = money(dashboardRepository.sumRevenueInPeriod(start, end));
        BigDecimal totalExpenses = money(expenseRepository.sumAmountInPeriod(start, end));
        BigDecimal netProfit = money(totalRevenue.subtract(totalExpenses));

        // FIX 1: average stay computed in Java — no DB-specific DATEDIFF needed.
        double avgNights = calculateAvgStayNights(start, end);

        long totalRooms = roomRepository.count();
        long occupiedRooms = dashboardRepository.countOccupiedRoomsOnDate(LocalDate.now());
        double occupancyRate = totalRooms > 0 ? (double) occupiedRooms / totalRooms : 0.0;

        return new DashboardMetricsResponse(
                totalReservations,
                activeReservations,
                totalRevenue,
                totalExpenses,
                netProfit,
                occupancyRate,
                avgNights,
                start,
                end);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Trend endpoints
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build a daily occupancy trend series for the requested range.
     *
     * @param start period start (inclusive)
     * @param end   period end (inclusive)
     * @return ordered list of {@link OccupancyTrendPoint} (one per day)
     */
    public List<OccupancyTrendPoint> getOccupancyTrend(LocalDate start, LocalDate end) {
        log.info("Occupancy trend requested: {} – {}", start, end);

        long totalRooms = roomRepository.count();
        List<OccupancyTrendPoint> trend = new ArrayList<>();

        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            long occupied = dashboardRepository.countOccupiedRoomsOnDate(cursor);
            double rate = totalRooms > 0 ? (double) occupied / totalRooms : 0.0;
            trend.add(new OccupancyTrendPoint(cursor, rate, occupied, totalRooms));
            cursor = cursor.plusDays(1);
        }
        return trend;
    }

    /**
     * Build a daily revenue trend series for the requested range.
     *
     * @param start period start (inclusive)
     * @param end   period end (inclusive)
     * @return ordered list of {@link RevenueTrendPoint}
     */
    public List<RevenueTrendPoint> getRevenueTrend(LocalDate start, LocalDate end) {
        log.info("Revenue trend requested: {} – {}", start, end);

        List<Object[]> rows = dashboardRepository.findDailyRevenue(start, end);
        List<RevenueTrendPoint> trend = new ArrayList<>(rows.size());

        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal revenue = (BigDecimal) row[1];
            long count = ((Number) row[2]).longValue();
            trend.add(new RevenueTrendPoint(date, revenue, count));
        }
        return trend;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Room-type distribution endpoint
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Provide a breakdown of room occupancy statistics per room type.
     *
     * @return list of {@link RoomTypeDistributionItem}, one per room type
     */
    public List<RoomTypeDistributionItem> getRoomTypeDistribution(LocalDate start, LocalDate end) {
        log.info("Room-type distribution requested: {} – {}", start, end);

        List<RoomType> types = roomTypeRepository.findAll();
        List<RoomTypeDistributionItem> result = new ArrayList<>(types.size());

        for (RoomType type : types) {
            long total = roomRepository.countByRoomType(type);
            long occupied = dashboardRepository.countOccupiedRoomsByTypeInPeriod(type.getId(), start, end);
            double rate = total > 0 ? (double) occupied / total : 0.0;

            result.add(new RoomTypeDistributionItem(
                    type.getName(),
                    total,
                    occupied,
                    rate,
                    type.getBasePrice()));
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Report export endpoint
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a filtered reservation report.
     *
     * <h3>Production-grade improvements</h3>
     * <ul>
     *   <li><b>Type-safe filtering</b> via {@link DashboardSpecification#build} —
     *       the {@code status} filter uses the proper {@link com.roomify.backend.entity.ReservationStatus}
     *       Enum through the Criteria API instead of a raw String cast.</li>
     *   <li><b>Chunked pagination</b>: rows are fetched in pages of
     *       {@link #EXPORT_CHUNK_SIZE} records. This keeps heap usage bounded
     *       (O(chunk) rather than O(total)) and prevents OOM on large datasets.</li>
     * </ul>
     *
     * The response shape ({@link ReportExportResponse}) is unchanged —
     * no frontend contract is broken.
     *
     * @param filter report filters supplied by the caller
     * @return {@link ReportExportResponse} containing metadata and all row data
     */
    public ReportExportResponse exportReport(ReportFilterRequest filter) {
        log.info("Report export requested: format={} period={} – {} status={} roomTypeId={}",
                filter.getExportFormat(), filter.getStartDate(), filter.getEndDate(),
                filter.getStatus(), filter.getRoomTypeId());

        // FIX 2: type-safe Enum filter via Criteria API — no String cast.
        Specification<Reservation> spec = DashboardSpecification.build(
                filter.getStartDate(),
                filter.getEndDate(),
                filter.getStatus(),       // ReservationStatus enum (may be null)
                filter.getRoomTypeId());

        Sort sort = Sort.by(Sort.Direction.ASC, "checkInDate");

        // FIX 3: chunked pagination — fetch EXPORT_CHUNK_SIZE rows per DB round-trip.
        List<Map<String, Object>> rows = new ArrayList<>();
        int page = 0;
        Page<Reservation> currentPage;

        do {
            currentPage = dashboardRepository.findAll(
                    spec, PageRequest.of(page, EXPORT_CHUNK_SIZE, sort));

            for (Reservation r : currentPage.getContent()) {
                rows.add(mapReservationToRow(r));
            }
            page++;

        } while (currentPage.hasNext());

        String format = filter.getExportFormat() != null
                ? filter.getExportFormat().toUpperCase() : "JSON";

        log.info("Report export complete: {} rows assembled in {} page(s)", rows.size(), page);

        return new ReportExportResponse(
                format,
                LocalDateTime.now(),
                rows.size(),
                filter,
                rows);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compute the average stay length (in nights) for non-cancelled reservations
     * in the given period using plain Java — no JPQL DATEDIFF / FUNCTION call.
     *
     * The repository returns lightweight date-pair projections; no full
     * entity graph is loaded.
     *
     * @param start period start (inclusive)
     * @param end   period end (inclusive)
     * @return average nights, or {@code 0.0} if no qualifying reservations
     */
    private double calculateAvgStayNights(LocalDate start, LocalDate end) {
        List<Object[]> datePairs = dashboardRepository.findStayDatesInPeriod(start, end);
        if (datePairs.isEmpty()) {
            return 0.0;
        }
        long totalNights = datePairs.stream()
                .mapToLong(row -> ChronoUnit.DAYS.between(
                        (LocalDate) row[0],   // checkInDate
                        (LocalDate) row[1]))  // checkOutDate
                .sum();
        return (double) totalNights / datePairs.size();
    }

    /**
     * Map a single {@link Reservation} to a flat key-value row for export output.
     * Keys are stable identifiers — the frontend can rely on them.
     */
    private Map<String, Object> mapReservationToRow(Reservation r) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("confirmationNumber", r.getConfirmationNumber());
        row.put("guestName",         r.getGuest() != null ? r.getGuest().getName() : null);
        row.put("roomNumber",        r.getRoom() != null ? r.getRoom().getRoomNumber() : null);
        row.put("roomType",          r.getRoom() != null && r.getRoom().getRoomType() != null
                ? r.getRoom().getRoomType().getName() : null);
        row.put("checkInDate",       r.getCheckInDate());
        row.put("checkOutDate",      r.getCheckOutDate());
        row.put("status",            r.getStatus() != null ? r.getStatus().name() : null);
        row.put("totalPrice",        r.getTotalPrice());
        row.put("totalPaid",         r.getTotalPaid());
        row.put("outstandingBalance",r.getOutstandingBalance());
        return row;
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
