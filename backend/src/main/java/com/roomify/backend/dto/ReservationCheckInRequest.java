package com.roomify.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public class ReservationCheckInRequest {

    @NotNull(message = "Actual check-in date is required")
    @PastOrPresent(message = "Actual check-in date cannot be in the future")
    private LocalDate actualCheckInDate;

    public ReservationCheckInRequest() {
    }

    public ReservationCheckInRequest(LocalDate actualCheckInDate) {
        this.actualCheckInDate = actualCheckInDate;
    }

    public LocalDate getActualCheckInDate() {
        return actualCheckInDate;
    }

    public void setActualCheckInDate(LocalDate actualCheckInDate) {
        this.actualCheckInDate = actualCheckInDate;
    }
}
