package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import java.math.BigDecimal;

public class ReservationActionPlaceholderResponse {

    private Long reservationId;
    private String action;
    private String message;
    private boolean placeholder;
    private ReservationStatus currentStatus;
    private String paymentStatus;
    private BigDecimal outstandingBalance;
    private boolean invoiceFinalized;

    public ReservationActionPlaceholderResponse() {
    }

    public ReservationActionPlaceholderResponse(
            Long reservationId,
            String action,
            String message,
            boolean placeholder,
            ReservationStatus currentStatus) {
        this(
                reservationId,
                action,
                message,
                placeholder,
                currentStatus,
                null,
                null,
                false);
    }

    public ReservationActionPlaceholderResponse(
            Long reservationId,
            String action,
            String message,
            boolean placeholder,
            ReservationStatus currentStatus,
            String paymentStatus,
            BigDecimal outstandingBalance,
            boolean invoiceFinalized) {
        this.reservationId = reservationId;
        this.action = action;
        this.message = message;
        this.placeholder = placeholder;
        this.currentStatus = currentStatus;
        this.paymentStatus = paymentStatus;
        this.outstandingBalance = outstandingBalance;
        this.invoiceFinalized = invoiceFinalized;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(boolean placeholder) {
        this.placeholder = placeholder;
    }

    public ReservationStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(ReservationStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public boolean isInvoiceFinalized() {
        return invoiceFinalized;
    }

    public void setInvoiceFinalized(boolean invoiceFinalized) {
        this.invoiceFinalized = invoiceFinalized;
    }
}
