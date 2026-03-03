package com.roomify.backend.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class ReservationModifyRequest {

    @FutureOrPresent(message = "Check-in date must be today or in the future")
    private LocalDate checkInDate;

    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    @NotBlank(message = "Modification reason is required")
    @Size(max = 500, message = "Modification reason cannot exceed 500 characters")
    private String modificationReason;

    public ReservationModifyRequest() {
    }

    public ReservationModifyRequest(LocalDate checkInDate, LocalDate checkOutDate, String modificationReason) {
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.modificationReason = modificationReason;
    }

    @AssertTrue(message = "Check-out date must be after check-in date")
    public boolean isDateRangeValid() {
        if (checkInDate == null || checkOutDate == null) {
            return true;
        }
        return checkOutDate.isAfter(checkInDate);
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

    public String getModificationReason() {
        return modificationReason;
    }

    public void setModificationReason(String modificationReason) {
        this.modificationReason = modificationReason;
    }
}
