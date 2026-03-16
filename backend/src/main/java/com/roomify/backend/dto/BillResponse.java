package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Full itemised bill breakdown for a reservation.
 */
public class BillResponse {

    private String confirmationNumber;
    private String guestName;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private long nights;
    private BigDecimal roomRate;
    private BigDecimal roomCharge;
    private BigDecimal serviceCharges;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal discountAmount;
    private BigDecimal balanceDue;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private boolean invoiceFinalized;
    private String paymentStatus;
    private List<BillLineItem> lineItems;

    public BillResponse() {
    }

    public BillResponse(
            String confirmationNumber,
            String guestName,
            String roomNumber,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            long nights,
            BigDecimal roomRate,
            BigDecimal roomCharge,
            BigDecimal serviceCharges,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal discountAmount,
            BigDecimal balanceDue,
            List<BillLineItem> lineItems) {
        this(
                confirmationNumber,
                guestName,
                roomNumber,
                checkInDate,
                checkOutDate,
                nights,
                roomRate,
                roomCharge,
                serviceCharges,
                vatRate,
                vatAmount,
                discountAmount,
                balanceDue,
                null,
                null,
                false,
                null,
                lineItems);
    }

    public BillResponse(
            String confirmationNumber,
            String guestName,
            String roomNumber,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            long nights,
            BigDecimal roomRate,
            BigDecimal roomCharge,
            BigDecimal serviceCharges,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal discountAmount,
            BigDecimal balanceDue,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance,
            boolean invoiceFinalized,
            String paymentStatus,
            List<BillLineItem> lineItems) {
        this.confirmationNumber = confirmationNumber;
        this.guestName = guestName;
        this.roomNumber = roomNumber;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.nights = nights;
        this.roomRate = roomRate;
        this.roomCharge = roomCharge;
        this.serviceCharges = serviceCharges;
        this.vatRate = vatRate;
        this.vatAmount = vatAmount;
        this.discountAmount = discountAmount;
        this.balanceDue = balanceDue;
        this.totalPaid = totalPaid;
        this.outstandingBalance = outstandingBalance;
        this.invoiceFinalized = invoiceFinalized;
        this.paymentStatus = paymentStatus;
        this.lineItems = lineItems;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
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

    public BigDecimal getRoomCharge() {
        return roomCharge;
    }

    public void setRoomCharge(BigDecimal roomCharge) {
        this.roomCharge = roomCharge;
    }

    public BigDecimal getServiceCharges() {
        return serviceCharges;
    }

    public void setServiceCharges(BigDecimal serviceCharges) {
        this.serviceCharges = serviceCharges;
    }

    public BigDecimal getVatRate() {
        return vatRate;
    }

    public void setVatRate(BigDecimal vatRate) {
        this.vatRate = vatRate;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getBalanceDue() {
        return balanceDue;
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
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

    public List<BillLineItem> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<BillLineItem> lineItems) {
        this.lineItems = lineItems;
    }
}
