package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReservationStatusUpdateRequest {

    @NotNull(message = "Target status is required")
    private ReservationStatus status;

    @Size(max = 1000, message = "Status note cannot exceed 1000 characters")
    private String note;

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
