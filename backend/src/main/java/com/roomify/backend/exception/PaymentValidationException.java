package com.roomify.backend.exception;

import java.math.BigDecimal;

public class PaymentValidationException extends ResourceConflictException {

    private final String code;
    private final String paymentStatus;
    private final BigDecimal outstandingBalance;
    private final boolean invoiceFinalized;

    public PaymentValidationException(
            String code,
            String message,
            String paymentStatus,
            BigDecimal outstandingBalance,
            boolean invoiceFinalized) {
        super(message);
        this.code = code;
        this.paymentStatus = paymentStatus;
        this.outstandingBalance = outstandingBalance;
        this.invoiceFinalized = invoiceFinalized;
    }

    public String getCode() {
        return code;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public boolean isInvoiceFinalized() {
        return invoiceFinalized;
    }
}
