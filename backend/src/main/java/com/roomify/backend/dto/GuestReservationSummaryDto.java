package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class GuestReservationSummaryDto {

    private String confirmation;
    private String status;
    private String roomNumber;
    private String roomType;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String invoiceNumber;
    private boolean invoiceFinalized;

    public GuestReservationSummaryDto() {
    }

    public GuestReservationSummaryDto(
            String confirmation,
            String status,
            String roomNumber,
            String roomType,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            BigDecimal totalAmount,
            String paymentStatus,
            String invoiceNumber,
            boolean invoiceFinalized) {
        this.confirmation = confirmation;
        this.status = status;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus;
        this.invoiceNumber = invoiceNumber;
        this.invoiceFinalized = invoiceFinalized;
    }

    public String getConfirmation() {
        return confirmation;
    }

    public void setConfirmation(String confirmation) {
        this.confirmation = confirmation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public boolean isInvoiceFinalized() {
        return invoiceFinalized;
    }

    public void setInvoiceFinalized(boolean invoiceFinalized) {
        this.invoiceFinalized = invoiceFinalized;
    }
}