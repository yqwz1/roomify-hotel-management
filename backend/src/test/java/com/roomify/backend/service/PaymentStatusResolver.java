package com.roomify.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PaymentStatusResolver {

    private static final int MONEY_SCALE = 2;

    private PaymentStatusResolver() {
    }

    public static String resolve(
            BigDecimal totalPaid,
            BigDecimal outstandingBalance,
            boolean invoiceFinalized) {

        BigDecimal safePaid = safeMoney(totalPaid);
        BigDecimal safeOutstanding = safeMoney(outstandingBalance);

        BigDecimal zero = BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        if (safeOutstanding.compareTo(zero) == 0) {
            return "PAID";
        }

        if (safePaid.compareTo(zero) > 0) {
            return "PARTIALLY_PAID";
        }

        return invoiceFinalized ? "UNPAID" : "PAYMENT_PENDING";
    }

    private static BigDecimal safeMoney(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}