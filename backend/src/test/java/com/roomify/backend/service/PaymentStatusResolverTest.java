package com.roomify.backend.service;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class PaymentStatusResolverTest {

    @Test
    void resolveShouldReturnPaidWhenOutstandingIsZero() {
        assertEquals(
                "PAID",
                PaymentStatusResolver.resolve(new BigDecimal("500.00"), BigDecimal.ZERO, false));
    }

    @Test
    void resolveShouldReturnPartiallyPaidWhenPaidIsPositiveAndOutstandingIsPositive() {
        assertEquals(
                "PARTIALLY_PAID",
                PaymentStatusResolver.resolve(new BigDecimal("100.00"), new BigDecimal("50.00"), false));
    }

    @Test
    void resolveShouldReturnPaymentPendingWhenInvoiceIsOpenAndNothingPaid() {
        assertEquals(
                "PAYMENT_PENDING",
                PaymentStatusResolver.resolve(BigDecimal.ZERO, new BigDecimal("75.00"), false));
    }

    @Test
    void resolveShouldReturnUnpaidWhenInvoiceIsFinalizedAndNothingPaid() {
        assertEquals(
                "UNPAID",
                PaymentStatusResolver.resolve(BigDecimal.ZERO, new BigDecimal("75.00"), true));
    }
}
