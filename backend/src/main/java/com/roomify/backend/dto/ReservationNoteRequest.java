package com.roomify.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReservationNoteRequest {

    @NotBlank(message = "Reservation note is required")
    @Size(max = 1000, message = "Reservation note cannot exceed 1000 characters")
    private String note;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
