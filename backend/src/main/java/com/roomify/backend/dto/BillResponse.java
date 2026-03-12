package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
    private BigDecimal discount;
    private BigDecimal balanceDue;
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
            BigDecimal discount,
            BigDecimal balanceDue,
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
        this.discount = discount;
        this.balanceDue = balanceDue;
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

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getBalanceDue() {
        return balanceDue;
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
    }

    public List<BillLineItem> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<BillLineItem> lineItems) {
        this.lineItems = lineItems;
    }
}
