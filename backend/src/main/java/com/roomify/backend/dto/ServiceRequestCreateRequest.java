package com.roomify.backend.dto;

import com.roomify.backend.entity.ServiceRequestPriority;
import com.roomify.backend.entity.ServiceRequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ServiceRequestCreateRequest {

    @NotNull(message = "Room selection is required")
    private Long roomId;

    @NotNull(message = "Service type is required")
    private ServiceRequestType serviceType;

    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private ServiceRequestPriority priority;

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public ServiceRequestType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceRequestType serviceType) {
        this.serviceType = serviceType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ServiceRequestPriority getPriority() {
        return priority;
    }

    public void setPriority(ServiceRequestPriority priority) {
        this.priority = priority;
    }
}
