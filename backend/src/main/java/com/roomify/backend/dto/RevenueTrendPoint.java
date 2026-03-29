package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A single data point in the daily revenue trend series.
 * GET /api/dashboard/trends/revenue
 */
public class RevenueTrendPoint {

    /** The calendar date this data point represents. */
    private LocalDate date;

    /** Total revenue generated on this date (from non-cancelled reservations). */
    private BigDecimal revenue;

    /** Number of reservations that checked in on this date. */
    private long reservationCount;

    public RevenueTrendPoint() {}

    public RevenueTrendPoint(LocalDate date, BigDecimal revenue, long reservationCount) {
        this.date = date;
        this.revenue = revenue;
        this.reservationCount = reservationCount;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    public long getReservationCount() { return reservationCount; }
    public void setReservationCount(long reservationCount) { this.reservationCount = reservationCount; }
}
