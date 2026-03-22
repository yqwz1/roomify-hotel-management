package com.roomify.backend.controller;

import com.roomify.backend.dto.DashboardMetricsResponse;
import com.roomify.backend.dto.OccupancyTrendPoint;
import com.roomify.backend.dto.ReportExportResponse;
import com.roomify.backend.dto.ReportFilterRequest;
import com.roomify.backend.dto.RevenueTrendPoint;
import com.roomify.backend.dto.RoomTypeDistributionItem;
import com.roomify.backend.service.DashboardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for dashboard and report endpoints.
 *
 * All endpoints require the MANAGER role, consistent with
 * {@link RoomController} and {@link StaffController}.
 *
 * Base path: /api/dashboard
 */
@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('MANAGER')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Metrics
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/dashboard/metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     *
     * Returns key hotel performance metrics for the specified period:
     * total reservations, active reservations, revenue, occupancy rate,
     * and average stay length.
     *
     * @param startDate period start (inclusive)
     * @param endDate   period end (inclusive)
     * @return 200 OK with {@link DashboardMetricsResponse}
     */
    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsResponse> getMetrics(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {

        DashboardMetricsResponse response = dashboardService.getMetrics(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Trend endpoints
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/dashboard/trends/occupancy?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     *
     * Returns a day-by-day occupancy trend series for the specified period.
     * Each element carries the date, number of occupied rooms, total rooms,
     * and the resulting occupancy rate fraction.
     *
     * @param startDate period start (inclusive)
     * @param endDate   period end (inclusive)
     * @return 200 OK with list of {@link OccupancyTrendPoint}
     */
    @GetMapping("/trends/occupancy")
    public ResponseEntity<List<OccupancyTrendPoint>> getOccupancyTrend(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {

        List<OccupancyTrendPoint> trend = dashboardService.getOccupancyTrend(startDate, endDate);
        return ResponseEntity.ok(trend);
    }

    /**
     * GET /api/dashboard/trends/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     *
     * Returns a day-by-day revenue trend series grouped by check-in date.
     * Each element carries the date, total revenue, and reservation count.
     *
     * @param startDate period start (inclusive)
     * @param endDate   period end (inclusive)
     * @return 200 OK with list of {@link RevenueTrendPoint}
     */
    @GetMapping("/trends/revenue")
    public ResponseEntity<List<RevenueTrendPoint>> getRevenueTrend(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {

        List<RevenueTrendPoint> trend = dashboardService.getRevenueTrend(startDate, endDate);
        return ResponseEntity.ok(trend);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Room-type distribution
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/dashboard/room-type-distribution
     *
     * Returns an occupancy breakdown per room type, showing total rooms,
     * currently occupied rooms, occupancy rate, and base price.
     *
     * @return 200 OK with list of {@link RoomTypeDistributionItem}
     */
    @GetMapping("/room-type-distribution")
    public ResponseEntity<List<RoomTypeDistributionItem>> getRoomTypeDistribution() {
        List<RoomTypeDistributionItem> distribution = dashboardService.getRoomTypeDistribution();
        return ResponseEntity.ok(distribution);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Report export
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/dashboard/reports/export
     *
     * Generates a filtered reservation report.  The request body carries the
     * date range and optional filters (status, roomTypeId, exportFormat).
     * The response always uses JSON in this foundation phase; "CSV" in
     * {@code exportFormat} is recorded but does not change the content type.
     *
     * @param filter validated report filter from request body
     * @return 200 OK with {@link ReportExportResponse}
     */
    @PostMapping("/reports/export")
    public ResponseEntity<ReportExportResponse> exportReport(
            @Valid @RequestBody ReportFilterRequest filter) {

        ReportExportResponse response = dashboardService.exportReport(filter);
        return ResponseEntity.ok(response);
    }
}
