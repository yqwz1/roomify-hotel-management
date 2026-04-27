package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.entity.ServiceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RoomServiceCompletionRequest {

    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    private LocalDateTime performedAt;

    private boolean applyStandardTemplate = true;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    @Valid
    private List<ServiceUsageRecordItemRequest> items;

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }

    public boolean isApplyStandardTemplate() {
        return applyStandardTemplate;
    }

    public void setApplyStandardTemplate(boolean applyStandardTemplate) {
        this.applyStandardTemplate = applyStandardTemplate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<ServiceUsageRecordItemRequest> getItems() {
        return items;
    }

    public void setItems(List<ServiceUsageRecordItemRequest> items) {
        this.items = items;
    }
}
