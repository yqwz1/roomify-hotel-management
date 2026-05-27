package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ReservationResponse {

    private Long id;
    private String confirmationNumber;
    private ReservationStatus status;
    private Long roomId;
    private String roomNumber;
    private Long guestId;
    private String guestName;
    private String guestEmail;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private long nights;
    private BigDecimal roomRate;
    private BigDecimal subtotal;
    private BigDecimal taxes;
    private BigDecimal totalPrice;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private boolean invoiceFinalized;
    private String invoiceStatus;
    private String paymentStatus;
    private String paymentMethod;
    private String transactionId;
    private LocalDateTime paymentTimestamp;
    private LocalDate actualCheckInDate;
    private LocalDateTime actualCheckOutAt;
    private String staffNotes;
    private LocalDateTime statusUpdatedAt;
    private Long version;
    private PricingBreakdownDto pricing;
    private List<ReservationHistoryResponse> statusHistory = new ArrayList<>();

    public ReservationResponse() {
    }

    public ReservationResponse(
            Long id,
            String confirmationNumber,
            ReservationStatus status,
            Long roomId,
            String roomNumber,
            Long guestId,
            String guestName,
            String guestEmail,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            long nights,
            BigDecimal roomRate,
            BigDecimal subtotal,
            BigDecimal taxes,
            BigDecimal totalPrice) {
        this(
                id,
                confirmationNumber,
                status,
                roomId,
                roomNumber,
                guestId,
                guestName,
                guestEmail,
                checkInDate,
                checkOutDate,
                nights,
                roomRate,
                subtotal,
                taxes,
                totalPrice,
                null,
                null,
                false,
                null);
    }

    public ReservationResponse(
            Long id,
            String confirmationNumber,
            ReservationStatus status,
            Long roomId,
            String roomNumber,
            Long guestId,
            String guestName,
            String guestEmail,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            long nights,
            BigDecimal roomRate,
            BigDecimal subtotal,
            BigDecimal taxes,
            BigDecimal totalPrice,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance,
            boolean invoiceFinalized,
            String paymentStatus) {
        this.id = id;
        this.confirmationNumber = confirmationNumber;
        this.status = status;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.guestId = guestId;
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.nights = nights;
        this.roomRate = roomRate;
        this.subtotal = subtotal;
        this.taxes = taxes;
        this.totalPrice = totalPrice;
        this.totalPaid = totalPaid;
        this.outstandingBalance = outstandingBalance;
        this.invoiceFinalized = invoiceFinalized;
        this.paymentStatus = paymentStatus;
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

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
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

    public Long getGuestId() {
        return guestId;
    }

    public void setGuestId(Long guestId) {
        this.guestId = guestId;
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

    public long getNights() {
        return nights;
    }

    public void setNights(long nights) {
        this.nights = nights;
    }

    public BigDecimal getRoomRate() {
        return roomRate;
    }

    public void setRoomRate(BigDecimal roomRate) {
        this.roomRate = roomRate;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxes() {
        return taxes;
    }

    public void setTaxes(BigDecimal taxes) {
        this.taxes = taxes;
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

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public LocalDateTime getPaymentTimestamp() {
        return paymentTimestamp;
    }

    public void setPaymentTimestamp(LocalDateTime paymentTimestamp) {
        this.paymentTimestamp = paymentTimestamp;
    }

    public LocalDate getActualCheckInDate() {
        return actualCheckInDate;
    }

    public void setActualCheckInDate(LocalDate actualCheckInDate) {
        this.actualCheckInDate = actualCheckInDate;
    }

    public LocalDateTime getActualCheckOutAt() {
        return actualCheckOutAt;
    }

    public void setActualCheckOutAt(LocalDateTime actualCheckOutAt) {
        this.actualCheckOutAt = actualCheckOutAt;
    }

    public String getStaffNotes() {
        return staffNotes;
    }

    public void setStaffNotes(String staffNotes) {
        this.staffNotes = staffNotes;
    }

    public LocalDateTime getStatusUpdatedAt() {
        return statusUpdatedAt;
    }

    public void setStatusUpdatedAt(LocalDateTime statusUpdatedAt) {
        this.statusUpdatedAt = statusUpdatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public PricingBreakdownDto getPricing() {
        return pricing;
    }

    public void setPricing(PricingBreakdownDto pricing) {
        this.pricing = pricing;
    }

    public List<ReservationHistoryResponse> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<ReservationHistoryResponse> statusHistory) {
        this.statusHistory = statusHistory;
    }
}
