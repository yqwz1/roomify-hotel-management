package com.roomify.backend.dto;

import com.roomify.backend.entity.ServiceUsageRecord;
import com.roomify.backend.entity.ServiceType;
import com.roomify.backend.entity.RoomStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ServiceUsageRecordResponse {

    private final Long id;
    private final Long roomId;
    private final String roomNumber;
    private final Long roomTypeId;
    private final String roomTypeName;
    private final ServiceType serviceType;
    private final Long templateId;
    private final String templateName;
    private final boolean appliedStandardTemplate;
    private final RoomStatus sourceRoomStatus;
    private final LocalDate serviceDate;
    private final LocalDateTime performedAt;
    private final BigDecimal totalCost;
    private final String notes;
    private final Long createdByUserId;
    private final String createdByEmail;
    private final LocalDateTime createdAt;
    private final List<ServiceUsageRecordItemResponse> items;

    public ServiceUsageRecordResponse(
            Long id,
            Long roomId,
            String roomNumber,
            Long roomTypeId,
            String roomTypeName,
            ServiceType serviceType,
            Long templateId,
            String templateName,
            boolean appliedStandardTemplate,
            RoomStatus sourceRoomStatus,
            LocalDate serviceDate,
            LocalDateTime performedAt,
            BigDecimal totalCost,
            String notes,
            Long createdByUserId,
            String createdByEmail,
            LocalDateTime createdAt,
            List<ServiceUsageRecordItemResponse> items) {
        this.id = id;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomTypeId = roomTypeId;
        this.roomTypeName = roomTypeName;
        this.serviceType = serviceType;
        this.templateId = templateId;
        this.templateName = templateName;
        this.appliedStandardTemplate = appliedStandardTemplate;
        this.sourceRoomStatus = sourceRoomStatus;
        this.serviceDate = serviceDate;
        this.performedAt = performedAt;
        this.totalCost = totalCost;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.createdByEmail = createdByEmail;
        this.createdAt = createdAt;
        this.items = items;
    }

    public static ServiceUsageRecordResponse from(ServiceUsageRecord record) {
        Long createdByUserId = record.getCreatedBy() != null ? record.getCreatedBy().getId() : null;
        String createdByEmail = record.getCreatedBy() != null ? record.getCreatedBy().getEmail() : null;
        return new ServiceUsageRecordResponse(
                record.getId(),
                record.getRoom() != null ? record.getRoom().getId() : null,
                record.getRoom() != null ? record.getRoom().getRoomNumber() : null,
                record.getRoomType() != null ? record.getRoomType().getId() : null,
                record.getRoomType() != null ? record.getRoomType().getName() : null,
                record.getServiceType(),
                record.getTemplate() != null ? record.getTemplate().getId() : null,
                record.getTemplate() != null ? record.getTemplate().getName() : null,
                record.isAppliedStandardTemplate(),
                record.getSourceRoomStatus(),
                record.getServiceDate(),
                record.getPerformedAt(),
                record.getTotalCost(),
                record.getNotes(),
                createdByUserId,
                createdByEmail,
                record.getCreatedAt(),
                record.getItems().stream().map(ServiceUsageRecordItemResponse::from).toList());
    }

    public Long getId() {
        return id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public String getRoomTypeName() {
        return roomTypeName;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public boolean isAppliedStandardTemplate() {
        return appliedStandardTemplate;
    }

    public RoomStatus getSourceRoomStatus() {
        return sourceRoomStatus;
    }

    public LocalDate getServiceDate() {
        return serviceDate;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public String getNotes() {
        return notes;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<ServiceUsageRecordItemResponse> getItems() {
        return items;
    }
}
