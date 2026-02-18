package com.roomify.backend.entity;

/**
 * Reservation lifecycle states.
 */
public enum ReservationStatus {
    PENDING,
    CONFIRMED,
    CHECKED_IN,
    CHECKED_OUT,
    CANCELLED
}
