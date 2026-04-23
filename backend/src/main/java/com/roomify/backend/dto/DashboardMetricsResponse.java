package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response DTO for the dashboard key metrics endpoint.
 * GET /api/dashboard/metrics
 */
public class DashboardMetricsResponse {

    /** Total number of reservations in the requested period. */
    private long totalReservations;

    /** Active reservations (CONFIRMED + CHECKED_IN) in the period. */
    private long activeReservations;

    /** Total revenue from non-cancelled reservations in the period. */
    private BigDecimal totalRevenue;

    /** Total operating expenses in the requested period. */
    private BigDecimal totalExpenses;

    /** Net profit calculated as revenue minus expenses. */
    private BigDecimal netProfit;

    /**
     * Overall occupancy rate expressed as a fraction (0.0 – 1.0).
     * Calculated as: occupied rooms / total rooms.
     */
    private double occupancyRate;

    /** Average number of nights per stay in the period. */
    private double averageStayNights;

    /** Start of the requested period (inclusive). */
    private LocalDate periodStart;

    /** End of the requested period (inclusive). */
    private LocalDate periodEnd;

    public DashboardMetricsResponse() {}

    public DashboardMetricsResponse(
            long totalReservations,
            long activeReservations,
            BigDecimal totalRevenue,
            BigDecimal totalExpenses,
            BigDecimal netProfit,
            double occupancyRate,
            double averageStayNights,
            LocalDate periodStart,
            LocalDate periodEnd) {
        this.totalReservations = totalReservations;
        this.activeReservations = activeReservations;
        this.totalRevenue = totalRevenue;
        this.totalExpenses = totalExpenses;
        this.netProfit = netProfit;
        this.occupancyRate = occupancyRate;
        this.averageStayNights = averageStayNights;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
    }

    public long getTotalReservations() { return totalReservations; }
    public void setTotalReservations(long totalReservations) { this.totalReservations = totalReservations; }

    public long getActiveReservations() { return activeReservations; }
    public void setActiveReservations(long activeReservations) { this.activeReservations = activeReservations; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public BigDecimal getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }

    public BigDecimal getNetProfit() { return netProfit; }
    public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }

    public double getOccupancyRate() { return occupancyRate; }
    public void setOccupancyRate(double occupancyRate) { this.occupancyRate = occupancyRate; }

    public double getAverageStayNights() { return averageStayNights; }
    public void setAverageStayNights(double averageStayNights) { this.averageStayNights = averageStayNights; }

    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }

    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
}
