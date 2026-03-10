package com.roomify.backend.dto;

import jakarta.validation.constraints.Size;

public class ReservationCancelRequest {

    @Size(max = 500, message = "Cancellation reason cannot exceed 500 characters")
    private String cancellationReason;

    public ReservationCancelRequest() {
    }

    public ReservationCancelRequest(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
