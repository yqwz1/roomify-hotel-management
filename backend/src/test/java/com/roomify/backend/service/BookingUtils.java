package com.roomify.backend.service;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

@Component
public class BookingUtils {

    private final AuditService auditService;

    public BookingUtils(AuditService auditService) {
        this.auditService = auditService;
    }

    // Constructor إضافي للاختبارات (بدون Audit)
    public BookingUtils() {
        this.auditService = null;
    }

    public boolean isOverlapping(LocalDate newStart, LocalDate newEnd, LocalDate existingStart, LocalDate existingEnd,
            Long roomId) {
        if (newStart == null || newEnd == null || existingStart == null || existingEnd == null) {
            return false;
        }

        boolean overlap = newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);

        if (auditService != null) {
            if (overlap) {
                auditService.log(
                        "BOOKING_VALIDATION_FAILED",
                        "ROOM:" + roomId,
                        "{\"reason\":\"Double booking overlap\"}");
            } else {
                auditService.log(
                        "BOOKING_VALIDATION_SUCCESS",
                        "ROOM:" + roomId,
                        "{\"reason\":\"No overlap\"}");
            }
        }

        return overlap;
    }
}
