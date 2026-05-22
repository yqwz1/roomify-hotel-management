package com.roomify.backend.entity;

/**
 * Reservation lifecycle states.
 */
public enum ReservationStatus {
    PENDING,
    PAYMENT_PENDING,
    CONFIRMED,
    CHECKED_IN,
    CHECKED_OUT,
    COMPLETED,
    CANCELLED,
    NO_SHOW,
    REFUNDED
}
