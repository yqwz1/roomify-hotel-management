package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request DTO for report generation filters.
 * Used as @RequestBody for POST /api/dashboard/reports/export
 */
public class ReportFilterRequest {

    /** Period start date (inclusive). Required. */
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    /** Period end date (inclusive). Required. */
    @NotNull(message = "End date is required")
    private LocalDate endDate;

    /**
     * Optional: filter by a specific room type ID.
     * When null, all room types are included.
     */
    private Long roomTypeId;

    /**
     * Optional: filter by reservation status.
     * When null, all statuses are included.
     */
    private ReservationStatus status;

    /**
     * Export format. Accepted values: "JSON" (default), "CSV".
     * The controller returns JSON in all cases for this foundation;
     * "CSV" is a placeholder for future streaming export work.
     */
    private String exportFormat = "JSON";

    public ReportFilterRequest() {}

    public ReportFilterRequest(
            LocalDate startDate,
            LocalDate endDate,
            Long roomTypeId,
            ReservationStatus status,
            String exportFormat) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.roomTypeId = roomTypeId;
        this.status = status;
        this.exportFormat = exportFormat != null ? exportFormat : "JSON";
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Long getRoomTypeId() { return roomTypeId; }
    public void setRoomTypeId(Long roomTypeId) { this.roomTypeId = roomTypeId; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }

    public String getExportFormat() { return exportFormat; }
    public void setExportFormat(String exportFormat) { this.exportFormat = exportFormat; }
}
