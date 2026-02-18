package com.roomify.backend.entity;

/**
 * Enum representing the status of a hotel room.
 */
public enum RoomStatus {
    /**
     * Room is available for booking.
     */
    AVAILABLE,

    /**
     * Room is currently occupied by a guest.
     */
    OCCUPIED,

    /**
     * Room needs cleaning before it can be made available.
     */
    NEEDS_CLEANING,

    /**
     * Room is under maintenance and not available for booking.
     */
    UNDER_MAINTENANCE
}
