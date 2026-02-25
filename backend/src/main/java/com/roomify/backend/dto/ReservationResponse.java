package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

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
}
