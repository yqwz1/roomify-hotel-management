package com.roomify.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for the report export endpoint.
 * POST /api/dashboard/reports/export
 *
 * The {@code data} field is a generic list of key-value maps so that
 * the structure can accommodate different report shapes without
 * requiring additional DTOs at the foundation stage.
 */
public class ReportExportResponse {

    /**
     * The export format requested by the caller (e.g. "JSON", "CSV").
     * In this foundation, only JSON is fully implemented.
     */
    private String format;

    /** Server timestamp when this report was generated. */
    private LocalDateTime generatedAt;

    /** Total number of records included in {@code data}. */
    private long totalRecords;

    /** The filters that were applied to produce this report. */
    private ReportFilterRequest filters;

    /**
     * Report rows. Each row is a flat map of column name → value.
     * Keys are stable identifiers safe for frontend consumption.
     */
    private List<Map<String, Object>> data;

    public ReportExportResponse() {}

    public ReportExportResponse(
            String format,
            LocalDateTime generatedAt,
            long totalRecords,
            ReportFilterRequest filters,
            List<Map<String, Object>> data) {
        this.format = format;
        this.generatedAt = generatedAt;
        this.totalRecords = totalRecords;
        this.filters = filters;
        this.data = data;
    }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public long getTotalRecords() { return totalRecords; }
    public void setTotalRecords(long totalRecords) { this.totalRecords = totalRecords; }

    public ReportFilterRequest getFilters() { return filters; }
    public void setFilters(ReportFilterRequest filters) { this.filters = filters; }

    public List<Map<String, Object>> getData() { return data; }
    public void setData(List<Map<String, Object>> data) { this.data = data; }
}
