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
    private Long reservationId;
    private String invoiceNumber;
    private String guestName;
    private String guestEmail;
    private String roomNumber;
    private String roomType;
    private String currency = "SAR";
    private String failureReason;
    private String lastFourDigits;
    private String invoiceStatus;
    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;
    private String refundReason;
    private String refundedBy;
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

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String guestEmail) {
        this.guestEmail = guestEmail;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getLastFourDigits() {
        return lastFourDigits;
    }

    public void setLastFourDigits(String lastFourDigits) {
        this.lastFourDigits = lastFourDigits;
    }

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public LocalDateTime getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(LocalDateTime refundedAt) {
        this.refundedAt = refundedAt;
    }

    public String getRefundReason() {
        return refundReason;
    }

    public void setRefundReason(String refundReason) {
        this.refundReason = refundReason;
    }

    public String getRefundedBy() {
        return refundedBy;
    }

    public void setRefundedBy(String refundedBy) {
        this.refundedBy = refundedBy;
    }
}
