package com.roomify.backend.dto;

import com.roomify.backend.entity.ServiceRequestStatus;
import jakarta.validation.constraints.NotNull;

public class ServiceRequestStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ServiceRequestStatus status;

    public ServiceRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceRequestStatus status) {
        this.status = status;
    }
}
