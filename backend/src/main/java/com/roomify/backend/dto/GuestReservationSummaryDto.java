package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;

public class GuestReservationSummaryDto {

    private Long id;
    private String confirmationNumber;
    private String status;
    private Long roomId;
    private String roomNumber;
    private String roomTypeName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal totalPrice;
    private String paymentStatus;
    private String invoiceNumber;
    private boolean invoiceFinalized;
    private String invoiceStatus;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;

    public GuestReservationSummaryDto() {
    }

    public GuestReservationSummaryDto(
            Long id,
            String confirmationNumber,
            String status,
            Long roomId,
            String roomNumber,
            String roomTypeName,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            BigDecimal totalPrice,
            String paymentStatus,
            String invoiceNumber,
            boolean invoiceFinalized,
            String invoiceStatus,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance) {
        this.id = id;
        this.confirmationNumber = confirmationNumber;
        this.status = status;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomTypeName = roomTypeName;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.totalPrice = totalPrice;
        this.paymentStatus = paymentStatus;
        this.invoiceNumber = invoiceNumber;
        this.invoiceFinalized = invoiceFinalized;
        this.invoiceStatus = invoiceStatus;
        this.totalPaid = totalPaid;
        this.outstandingBalance = outstandingBalance;
    }

    public GuestReservationSummaryDto(
            Long id,
            String confirmationNumber,
            String status,
            Long roomId,
            String roomNumber,
            String roomTypeName,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            BigDecimal totalPrice,
            String paymentStatus,
            String invoiceNumber,
            boolean invoiceFinalized,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance) {
        this(
                id,
                confirmationNumber,
                status,
                roomId,
                roomNumber,
                roomTypeName,
                checkInDate,
                checkOutDate,
                totalPrice,
                paymentStatus,
                invoiceNumber,
                invoiceFinalized,
                invoiceFinalized ? "PAID" : "PENDING",
                totalPaid,
                outstandingBalance);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    /**
     * Backward-compatible alias preserved for legacy guest dashboard consumers.
     */
    @JsonProperty("confirmation")
    public String getConfirmation() {
        return confirmationNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomTypeName() {
        return roomTypeName;
    }

    public void setRoomTypeName(String roomTypeName) {
        this.roomTypeName = roomTypeName;
    }

    /**
     * Backward-compatible alias preserved for older clients expecting roomType.
     */
    @JsonProperty("roomType")
    public String getRoomType() {
        return roomTypeName;
    }

    public void setRoomType(String roomType) {
        this.roomTypeName = roomType;
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

    /**
     * Backward-compatible alias preserved for older clients expecting totalAmount.
     */
    @JsonProperty("totalAmount")
    public BigDecimal getTotalAmount() {
        return totalPrice;
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

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
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
}
