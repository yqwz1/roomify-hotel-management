package com.roomify.backend.dto;

import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long paymentId;
    private String confirmationNumber;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private BigDecimal totalPaid;
    private BigDecimal remainingBalance;
    private boolean invoiceFinalized;
    private String gatewayReference;
    private String message;
    private LocalDateTime createdAt;

    public PaymentResponse(
            Long paymentId,
            String confirmationNumber,
            BigDecimal amount,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            BigDecimal totalPaid,
            BigDecimal remainingBalance,
            boolean invoiceFinalized,
            String gatewayReference,
            String message,
            LocalDateTime createdAt) {
        this.paymentId = paymentId;
        this.confirmationNumber = confirmationNumber;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.totalPaid = totalPaid;
        this.remainingBalance = remainingBalance;
        this.invoiceFinalized = invoiceFinalized;
        this.gatewayReference = gatewayReference;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public boolean isInvoiceFinalized() {
        return invoiceFinalized;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}