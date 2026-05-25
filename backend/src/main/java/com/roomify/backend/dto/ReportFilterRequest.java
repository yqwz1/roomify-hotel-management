package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;

/**
 * Request DTO for report generation filters.
 * Used as @RequestBody for POST /api/dashboard/reports/export
 */
public class ReportFilterRequest {

    private static final String DEFAULT_EXPORT_FORMAT = "JSON";
    private static final Set<String> SUPPORTED_EXPORT_FORMATS = Set.of("JSON", "CSV", "EXCEL");

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
     * Export format metadata requested by the caller.
     * Supported values are normalized to uppercase and limited to
     * JSON, CSV, or EXCEL. Unsupported values fall back to JSON.
     */
    private String exportFormat = DEFAULT_EXPORT_FORMAT;

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
        this.exportFormat = normalizeExportFormat(exportFormat);
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
    public void setExportFormat(String exportFormat) { this.exportFormat = normalizeExportFormat(exportFormat); }

    @AssertTrue(message = "End date must be on or after start date")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }

    private String normalizeExportFormat(String exportFormat) {
        if (exportFormat == null || exportFormat.isBlank()) {
            return DEFAULT_EXPORT_FORMAT;
        }

        String normalized = exportFormat.trim().toUpperCase(Locale.ROOT);
        return SUPPORTED_EXPORT_FORMATS.contains(normalized) ? normalized : DEFAULT_EXPORT_FORMAT;
    }
}
