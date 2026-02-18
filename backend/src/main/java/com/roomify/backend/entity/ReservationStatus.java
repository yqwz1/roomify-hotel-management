package com.roomify.backend.entity;

/**
 * Enum representing the status of a reservation.
 */
public enum ReservationStatus {
    /**
     * Reservation has been created but not yet confirmed.
     */
    PENDING,

    /**
     * Reservation has been confirmed.
     */
    CONFIRMED,

    /**
     * Guest has checked in.
     */
    CHECKED_IN,

    /**
     * Guest has checked out.
     */
    CHECKED_OUT,

    /**
     * Reservation has been cancelled.
     */
    CANCELLED
}
