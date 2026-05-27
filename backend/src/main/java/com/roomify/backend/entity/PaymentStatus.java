package com.roomify.backend.entity;

public enum PaymentStatus {
    PENDING,
    PROCESSING,
    UNPAID,
    PARTIALLY_PAID,
    PAID,
    FAILED,
    CANCELLED,
    REFUNDED
}
