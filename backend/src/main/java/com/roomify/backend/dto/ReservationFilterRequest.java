package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import java.time.LocalDate;
import java.util.Locale;
import org.springframework.format.annotation.DateTimeFormat;

/**
 * Query DTO for reservation list filtering.
 * Bound from GET /api/reservations query parameters.
 */
public class ReservationFilterRequest {

    private String confirmation;
    private String confirmationNumber;
    private String guestName;
    private ReservationStatus status;
    private String queueTab;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate checkInDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate checkOutDate;

    public ReservationFilterRequest() {
    }

    public ReservationFilterRequest(
            String confirmation,
            String guestName,
            ReservationStatus status,
            LocalDate checkInDate,
            LocalDate checkOutDate) {
        this.confirmation = confirmation;
        this.guestName = guestName;
        this.status = status;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
    }

    public String getConfirmation() {
        return confirmation;
    }

    public void setConfirmation(String confirmation) {
        this.confirmation = confirmation;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
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

    public String getQueueTab() {
        return queueTab;
    }

    public void setQueueTab(String queueTab) {
        this.queueTab = queueTab;
    }

    public boolean hasConfirmationFilter() {
        return normalizedConfirmation() != null;
    }

    public String normalizedConfirmation() {
        String normalized = normalizeBlankToNull(confirmation);
        if (normalized == null) {
            normalized = normalizeBlankToNull(confirmationNumber);
        }
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT);
    }

    public String normalizedGuestName() {
        return normalizeWhitespace(guestName);
    }

    public ReservationStatus effectiveStatus() {
        if (status != null) {
            return status;
        }

        String normalizedTab = normalizeBlankToNull(queueTab);
        if (normalizedTab == null) {
            return null;
        }

        String canonicalTab = normalizedTab
                .replaceAll("([a-z])([A-Z])", "$1_$2")
                .replace(' ', '_')
                .replace('-', '_');
        canonicalTab = canonicalTab.toUpperCase(Locale.ROOT);

        return switch (canonicalTab) {
            case "ALL" -> null;
            case "PENDING" -> ReservationStatus.PENDING;
            case "PAYMENT_PENDING" -> ReservationStatus.PAYMENT_PENDING;
            case "ARRIVALS", "CONFIRMED" -> ReservationStatus.CONFIRMED;
            case "IN_HOUSE", "DEPARTURES", "CHECKED_IN" -> ReservationStatus.CHECKED_IN;
            case "CHECKED_OUT" -> ReservationStatus.CHECKED_OUT;
            case "COMPLETED" -> ReservationStatus.COMPLETED;
            case "CANCELLED" -> ReservationStatus.CANCELLED;
            case "NO_SHOW" -> ReservationStatus.NO_SHOW;
            case "REFUNDED" -> ReservationStatus.REFUNDED;
            default -> null;
        };
    }

    private String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeWhitespace(String value) {
        String trimmed = normalizeBlankToNull(value);
        return trimmed == null ? null : trimmed.replaceAll("\\s+", " ");
    }
}
