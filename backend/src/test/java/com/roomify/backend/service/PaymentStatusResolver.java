package com.roomify.backend.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaymentStatusResolverTest {

    @Test
    void shouldReturnPaymentPending_whenNoPaymentAndNotFinalized() {
        String status = PaymentStatusResolver.resolve(
                BigDecimal.ZERO,
                new BigDecimal("500.00"),
                false);

        assertEquals("PAYMENT_PENDING", status);
    }

    @Test
    void shouldReturnUnpaid_whenNoPaymentAndFinalized() {
        String status = PaymentStatusResolver.resolve(
                BigDecimal.ZERO,
                new BigDecimal("500.00"),
                true);

        assertEquals("UNPAID", status);
    }

    @Test
    void shouldReturnPartiallyPaid_whenPartialPaymentExists() {
        String status = PaymentStatusResolver.resolve(
                new BigDecimal("200.00"),
                new BigDecimal("300.00"),
                false);

        assertEquals("PARTIALLY_PAID", status);
    }

    @Test
    void shouldReturnPaid_whenOutstandingIsZero_andFinalized() {
        String status = PaymentStatusResolver.resolve(
                new BigDecimal("500.00"),
                BigDecimal.ZERO,
                true);

        assertEquals("PAID", status);
    }

    @Test
    void shouldReturnPaid_whenOutstandingIsZero_evenIfNotFinalized() {
        String status = PaymentStatusResolver.resolve(
                new BigDecimal("500.00"),
                BigDecimal.ZERO,
                false);

        assertEquals("PAID", status);
    }
}