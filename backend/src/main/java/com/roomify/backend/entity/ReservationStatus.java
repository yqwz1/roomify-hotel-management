package com.roomify.backend.entity;

import java.util.EnumSet;
import java.util.Set;

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
    REFUNDED;

    public static Set<ReservationStatus> availabilityBlockingStatuses() {
        return EnumSet.of(PENDING, PAYMENT_PENDING, CONFIRMED, CHECKED_IN);
    }
}
