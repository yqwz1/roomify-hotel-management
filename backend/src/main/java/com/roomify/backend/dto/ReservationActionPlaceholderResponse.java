package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;

public class ReservationActionPlaceholderResponse {

    private Long reservationId;
    private String action;
    private String message;
    private boolean placeholder;
    private ReservationStatus currentStatus;

    public ReservationActionPlaceholderResponse() {
    }

    public ReservationActionPlaceholderResponse(
            Long reservationId,
            String action,
            String message,
            boolean placeholder,
            ReservationStatus currentStatus) {
        this.reservationId = reservationId;
        this.action = action;
        this.message = message;
        this.placeholder = placeholder;
        this.currentStatus = currentStatus;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(boolean placeholder) {
        this.placeholder = placeholder;
    }

    public ReservationStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(ReservationStatus currentStatus) {
        this.currentStatus = currentStatus;
    }
}
