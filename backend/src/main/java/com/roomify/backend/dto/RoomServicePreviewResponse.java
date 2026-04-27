package com.roomify.backend.dto;

import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.ServiceType;

import java.math.BigDecimal;
import java.util.List;

public class RoomServicePreviewResponse {

    private final Long roomId;
    private final String roomNumber;
    private final Long roomTypeId;
    private final String roomTypeName;
    private final RoomStatus roomStatus;
    private final ServiceType serviceType;
    private final Long templateId;
    private final String templateName;
    private final boolean usingTemplate;
    private final BigDecimal estimatedTotalCost;
    private final List<ServiceUsagePreviewItemResponse> items;
    private final List<String> warnings;

    public RoomServicePreviewResponse(
            Long roomId,
            String roomNumber,
            Long roomTypeId,
            String roomTypeName,
            RoomStatus roomStatus,
            ServiceType serviceType,
            Long templateId,
            String templateName,
            boolean usingTemplate,
            BigDecimal estimatedTotalCost,
            List<ServiceUsagePreviewItemResponse> items,
            List<String> warnings) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomTypeId = roomTypeId;
        this.roomTypeName = roomTypeName;
        this.roomStatus = roomStatus;
        this.serviceType = serviceType;
        this.templateId = templateId;
        this.templateName = templateName;
        this.usingTemplate = usingTemplate;
        this.estimatedTotalCost = estimatedTotalCost;
        this.items = items;
        this.warnings = warnings;
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

    public RoomStatus getRoomStatus() {
        return roomStatus;
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

    public boolean isUsingTemplate() {
        return usingTemplate;
    }

    public BigDecimal getEstimatedTotalCost() {
        return estimatedTotalCost;
    }

    public List<ServiceUsagePreviewItemResponse> getItems() {
        return items;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
