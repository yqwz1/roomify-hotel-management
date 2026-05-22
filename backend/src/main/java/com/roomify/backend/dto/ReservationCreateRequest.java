package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ReservationCreateRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Check-in date is required")
    @FutureOrPresent(message = "Check-in date must be today or in the future")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    private ReservationStatus status;

    @NotNull(message = "Guest details are required")
    @Valid
    private ReservationGuestRequest guest;

    public ReservationCreateRequest() {
    }

    public ReservationCreateRequest(
            Long roomId,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            ReservationStatus status,
            ReservationGuestRequest guest) {
        this.roomId = roomId;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.status = status;
        this.guest = guest;
    }

    @AssertTrue(message = "Check-out date must be after check-in date")
    public boolean isDateRangeValid() {
        if (checkInDate == null || checkOutDate == null) {
            return true;
        }
        return checkOutDate.isAfter(checkInDate);
    }

    @AssertTrue(message = "Reservation status must be PENDING")
    public boolean isInitialStatusValid() {
        if (status == null) {
            return true;
        }
        return status == ReservationStatus.PENDING;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
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

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public ReservationGuestRequest getGuest() {
        return guest;
    }

    public void setGuest(ReservationGuestRequest guest) {
        this.guest = guest;
    }
}
