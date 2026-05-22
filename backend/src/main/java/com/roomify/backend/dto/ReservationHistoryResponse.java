package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import java.time.LocalDateTime;

public class ReservationHistoryResponse {

    private ReservationStatus fromStatus;
    private ReservationStatus toStatus;
    private String actorEmail;
    private String actorRole;
    private String note;
    private LocalDateTime changedAt;

    public ReservationHistoryResponse() {
    }

    public ReservationHistoryResponse(
            ReservationStatus fromStatus,
            ReservationStatus toStatus,
            String actorEmail,
            String actorRole,
            String note,
            LocalDateTime changedAt) {
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.note = note;
        this.changedAt = changedAt;
    }

    public ReservationStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(ReservationStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public ReservationStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(ReservationStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }
}
