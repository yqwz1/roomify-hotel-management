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
     * Room is under maintenance and not available for booking.
     */
    MAINTENANCE,
    
    /**
     * Room is out of service (e.g., renovation, permanent closure).
     */
    OUT_OF_SERVICE
}
