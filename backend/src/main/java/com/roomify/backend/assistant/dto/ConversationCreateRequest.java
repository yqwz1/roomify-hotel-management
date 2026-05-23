package com.roomify.backend.assistant.dto;

import jakarta.validation.constraints.Size;

public class ConversationCreateRequest {

    @Size(max = 160, message = "Subject cannot exceed 160 characters")
    private String subject;

    private Long reservationId;

    private Long roomId;

    private Long serviceRequestId;

    @Size(max = 10, message = "Preferred language cannot exceed 10 characters")
    private String preferredLanguage;

    private Boolean aiFallbackEnabled;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getServiceRequestId() {
        return serviceRequestId;
    }

    public void setServiceRequestId(Long serviceRequestId) {
        this.serviceRequestId = serviceRequestId;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public Boolean getAiFallbackEnabled() {
        return aiFallbackEnabled;
    }

    public void setAiFallbackEnabled(Boolean aiFallbackEnabled) {
        this.aiFallbackEnabled = aiFallbackEnabled;
    }
}
