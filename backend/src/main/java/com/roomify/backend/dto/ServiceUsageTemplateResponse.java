package com.roomify.backend.dto;

import com.roomify.backend.entity.ServiceUsageTemplate;
import com.roomify.backend.entity.ServiceUsageTemplateItem;
import com.roomify.backend.entity.ServiceType;

import java.time.LocalDateTime;
import java.util.List;

public class ServiceUsageTemplateResponse {

    private final Long id;
    private final String name;
    private final ServiceType serviceType;
    private final Long roomTypeId;
    private final String roomTypeName;
    private final boolean active;
    private final String notes;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final List<ServiceUsageTemplateItemResponse> items;

    public ServiceUsageTemplateResponse(
            Long id,
            String name,
            ServiceType serviceType,
            Long roomTypeId,
            String roomTypeName,
            boolean active,
            String notes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<ServiceUsageTemplateItemResponse> items) {
        this.id = id;
        this.name = name;
        this.serviceType = serviceType;
        this.roomTypeId = roomTypeId;
        this.roomTypeName = roomTypeName;
        this.active = active;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.items = items;
    }

    public static ServiceUsageTemplateResponse from(ServiceUsageTemplate template) {
        List<ServiceUsageTemplateItemResponse> itemResponses = template.getItems().stream()
                .map(ServiceUsageTemplateResponse::mapItem)
                .toList();
        return new ServiceUsageTemplateResponse(
                template.getId(),
                template.getName(),
                template.getServiceType(),
                template.getRoomType() != null ? template.getRoomType().getId() : null,
                template.getRoomType() != null ? template.getRoomType().getName() : null,
                template.isActive(),
                template.getNotes(),
                template.getCreatedAt(),
                template.getUpdatedAt(),
                itemResponses);
    }

    private static ServiceUsageTemplateItemResponse mapItem(ServiceUsageTemplateItem item) {
        return new ServiceUsageTemplateItemResponse(
                item.getId(),
                item.getInventoryItem().getId(),
                item.getInventoryItem().getName(),
                item.getInventoryItem().getCategory().name(),
                item.getInventoryItem().getUnitOfMeasure().name(),
                item.getStandardQuantity(),
                item.isActive(),
                item.getNotes());
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public String getRoomTypeName() {
        return roomTypeName;
    }

    public boolean isActive() {
        return active;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<ServiceUsageTemplateItemResponse> getItems() {
        return items;
    }
}
