package com.roomify.backend.dto;

import java.math.BigDecimal;

/**
 * One element in the room-type distribution breakdown.
 * GET /api/dashboard/room-type-distribution
 */
public class RoomTypeDistributionItem {

    /** Name of the room type (e.g. "Deluxe", "Suite"). */
    private String roomTypeName;

    /** Total number of rooms belonging to this room type. */
    private long totalRooms;

    /**
     * Number of rooms of this type that are currently occupied (CHECKED_IN).
     * Derived from active reservations at query time.
     */
    private long occupiedRooms;

    /**
     * Occupancy rate for this room type as a fraction (0.0 – 1.0).
     * Calculated as: occupiedRooms / totalRooms. Returns 0.0 when totalRooms is 0.
     */
    private double occupancyRate;

    /** Base nightly price configured for this room type. */
    private BigDecimal basePrice;

    public RoomTypeDistributionItem() {}

    public RoomTypeDistributionItem(
            String roomTypeName,
            long totalRooms,
            long occupiedRooms,
            double occupancyRate,
            BigDecimal basePrice) {
        this.roomTypeName = roomTypeName;
        this.totalRooms = totalRooms;
        this.occupiedRooms = occupiedRooms;
        this.occupancyRate = occupancyRate;
        this.basePrice = basePrice;
    }

    public String getRoomTypeName() { return roomTypeName; }
    public void setRoomTypeName(String roomTypeName) { this.roomTypeName = roomTypeName; }

    public long getTotalRooms() { return totalRooms; }
    public void setTotalRooms(long totalRooms) { this.totalRooms = totalRooms; }

    public long getOccupiedRooms() { return occupiedRooms; }
    public void setOccupiedRooms(long occupiedRooms) { this.occupiedRooms = occupiedRooms; }

    public double getOccupancyRate() { return occupancyRate; }
    public void setOccupancyRate(double occupancyRate) { this.occupancyRate = occupancyRate; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
}
