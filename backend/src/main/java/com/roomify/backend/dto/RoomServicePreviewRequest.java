package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.entity.ServiceType;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RoomServicePreviewRequest {

    private ServiceType serviceType;

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }
}
