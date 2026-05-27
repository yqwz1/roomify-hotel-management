package com.roomify.backend.service;

import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationAudit;
import com.roomify.backend.entity.ReservationHistory;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.ReservationAuditRepository;
import com.roomify.backend.repository.ReservationHistoryRepository;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ReservationStatusTransitionService {

    private final ReservationHistoryRepository reservationHistoryRepository;
    private final ReservationAuditRepository reservationAuditRepository;

    public ReservationStatusTransitionService(
            ReservationHistoryRepository reservationHistoryRepository,
            ReservationAuditRepository reservationAuditRepository) {
        this.reservationHistoryRepository = reservationHistoryRepository;
        this.reservationAuditRepository = reservationAuditRepository;
    }

    public void initialize(Reservation reservation, ReservationStatus initialStatus, ReservationActor actor, String note) {
        ReservationStatus effectiveStatus = initialStatus != null ? initialStatus : ReservationStatus.PENDING;
        reservation.setStatus(effectiveStatus);
        reservation.setStatusUpdatedAt(LocalDateTime.now());
        recordHistory(reservation, null, effectiveStatus, actor, note);
        recordAudit(reservation, "RESERVATION_CREATED", actor, "to=" + effectiveStatus.name());
    }

    public void transition(
            Reservation reservation,
            ReservationStatus targetStatus,
            ReservationActor actor,
            String note,
            boolean managerOverride) {
        ReservationStatus currentStatus = reservation.getStatus();
        if (currentStatus == targetStatus) {
            return;
        }

        if (!managerOverride) {
            validateStandardTransition(currentStatus, targetStatus);
        }

        if (targetStatus == ReservationStatus.REFUNDED && !actor.hasRole("ROLE_MANAGER")) {
            throw new ResourceConflictException("Only managers can approve refunded reservations");
        }

        reservation.setStatus(targetStatus);
        reservation.setStatusUpdatedAt(LocalDateTime.now());
        recordHistory(reservation, currentStatus, targetStatus, actor, note);
        recordAudit(
                reservation,
                "RESERVATION_STATUS_CHANGED",
                actor,
                "from=" + currentStatus.name() + " to=" + targetStatus.name());
    }

    public ReservationStatus resolveInitialGuestStatus() {
        return ReservationStatus.PAYMENT_PENDING;
    }

    public ReservationStatus resolvePostPaymentStatus(Reservation reservation) {
        return switch (reservation.getPaymentStatus()) {
            case PAID, PARTIALLY_PAID -> ReservationStatus.CONFIRMED;
            case REFUNDED -> ReservationStatus.REFUNDED;
            case PROCESSING, CANCELLED -> ReservationStatus.PAYMENT_PENDING;
            default -> ReservationStatus.PAYMENT_PENDING;
        };
    }

    private void validateStandardTransition(ReservationStatus currentStatus, ReservationStatus targetStatus) {
        Set<ReservationStatus> validTargets = switch (currentStatus) {
            case PENDING -> EnumSet.of(
                    ReservationStatus.PAYMENT_PENDING,
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.CANCELLED);
            case PAYMENT_PENDING -> EnumSet.of(
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.CANCELLED);
            case CONFIRMED -> EnumSet.of(
                    ReservationStatus.CHECKED_IN,
                    ReservationStatus.CANCELLED,
                    ReservationStatus.NO_SHOW);
            case CHECKED_IN -> EnumSet.of(ReservationStatus.CHECKED_OUT);
            case CHECKED_OUT -> EnumSet.of(
                    ReservationStatus.COMPLETED,
                    ReservationStatus.REFUNDED);
            case COMPLETED, CANCELLED, NO_SHOW, REFUNDED -> EnumSet.noneOf(ReservationStatus.class);
        };

        if (!validTargets.contains(targetStatus)) {
            throw new ResourceConflictException(
                    "Invalid reservation status transition: " + currentStatus + " -> " + targetStatus);
        }
    }

    private void recordHistory(
            Reservation reservation,
            ReservationStatus fromStatus,
            ReservationStatus toStatus,
            ReservationActor actor,
            String note) {
        ReservationHistory entry = new ReservationHistory();
        entry.setReservation(reservation);
        entry.setFromStatus(fromStatus);
        entry.setToStatus(toStatus);
        entry.setActorEmail(actor.email());
        entry.setActorRole(actor.roleCode());
        entry.setNote(normalize(note));
        reservationHistoryRepository.save(entry);
    }

    private void recordAudit(
            Reservation reservation,
            String eventType,
            ReservationActor actor,
            String details) {
        ReservationAudit audit = new ReservationAudit();
        audit.setReservation(reservation);
        audit.setEventType(eventType);
        audit.setActorEmail(actor.email());
        audit.setActorRole(actor.roleCode());
        audit.setDetails(details);
        reservationAuditRepository.save(audit);
    }

    private String normalize(String note) {
        if (note == null) {
            return null;
        }
        String trimmed = note.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record ReservationActor(String email, String roleCode) {
        public boolean hasRole(String role) {
            return roleCode != null && roleCode.equalsIgnoreCase(role);
        }
    }
}
