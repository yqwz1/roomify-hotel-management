package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InvoiceListItemDto {

    private Long reservationId;
    private String confirmationNumber;
    private String invoiceNumber;
    private String guestName;
    private String guestEmail;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal totalPrice;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private boolean invoiceFinalized;
    private String paymentStatus;
    private String deliveryStatus;
    private LocalDateTime deliverySentAt;

    public InvoiceListItemDto() {
    }

    public InvoiceListItemDto(
            Long reservationId,
            String confirmationNumber,
            String invoiceNumber,
            String guestName,
            String guestEmail,
            String roomNumber,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            BigDecimal totalPrice,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance,
            boolean invoiceFinalized,
            String paymentStatus,
            String deliveryStatus,
            LocalDateTime deliverySentAt) {
        this.reservationId = reservationId;
        this.confirmationNumber = confirmationNumber;
        this.invoiceNumber = invoiceNumber;
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.roomNumber = roomNumber;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.totalPrice = totalPrice;
        this.totalPaid = totalPaid;
        this.outstandingBalance = outstandingBalance;
        this.invoiceFinalized = invoiceFinalized;
        this.paymentStatus = paymentStatus;
        this.deliveryStatus = deliveryStatus;
        this.deliverySentAt = deliverySentAt;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
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

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
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

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(String deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public LocalDateTime getDeliverySentAt() {
        return deliverySentAt;
    }

    public void setDeliverySentAt(LocalDateTime deliverySentAt) {
        this.deliverySentAt = deliverySentAt;
    }
}
