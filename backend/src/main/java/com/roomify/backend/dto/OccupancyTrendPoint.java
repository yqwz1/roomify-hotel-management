package com.roomify.backend.dto;

import java.time.LocalDate;

/**
 * A single data point in the daily occupancy trend series.
 * GET /api/dashboard/trends/occupancy
 */
public class OccupancyTrendPoint {

    /** The calendar date this data point represents. */
    private LocalDate date;

    /**
     * Occupancy rate for this day as a fraction (0.0 – 1.0).
     * Calculated as: occupiedRooms / totalRooms.
     */
    private double occupancyRate;

    /** Number of rooms that were occupied (CHECKED_IN) on this date. */
    private long occupiedRooms;

    /** Total number of rooms in the property on this date. */
    private long totalRooms;

    public OccupancyTrendPoint() {}

    public OccupancyTrendPoint(LocalDate date, double occupancyRate, long occupiedRooms, long totalRooms) {
        this.date = date;
        this.occupancyRate = occupancyRate;
        this.occupiedRooms = occupiedRooms;
        this.totalRooms = totalRooms;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public double getOccupancyRate() { return occupancyRate; }
    public void setOccupancyRate(double occupancyRate) { this.occupancyRate = occupancyRate; }

    public long getOccupiedRooms() { return occupiedRooms; }
    public void setOccupiedRooms(long occupiedRooms) { this.occupiedRooms = occupiedRooms; }

    public long getTotalRooms() { return totalRooms; }
    public void setTotalRooms(long totalRooms) { this.totalRooms = totalRooms; }
}
