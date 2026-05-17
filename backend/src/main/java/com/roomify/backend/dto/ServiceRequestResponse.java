package com.roomify.backend.dto;

import com.roomify.backend.entity.ServiceRequest;
import com.roomify.backend.entity.ServiceRequestPriority;
import com.roomify.backend.entity.ServiceRequestStatus;
import com.roomify.backend.entity.ServiceRequestType;
import java.time.LocalDateTime;

public class ServiceRequestResponse {

    private Long id;
    private Long guestId;
    private String guestName;
    private Long roomId;
    private String roomNumber;
    private ServiceRequestType serviceType;
    private String description;
    private ServiceRequestPriority priority;
    private ServiceRequestStatus status;
    private LocalDateTime createdAt;

    public static ServiceRequestResponse from(ServiceRequest entity) {
        ServiceRequestResponse response = new ServiceRequestResponse();
        response.setId(entity.getId());
        response.setGuestId(entity.getGuestId());
        response.setGuestName(entity.getGuest() != null ? entity.getGuest().getName() : null);
        response.setRoomId(entity.getRoomId());
        response.setRoomNumber(entity.getRoom() != null ? entity.getRoom().getRoomNumber() : null);
        response.setServiceType(entity.getServiceType());
        response.setDescription(entity.getDescription());
        response.setPriority(entity.getPriority());
        response.setStatus(entity.getStatus());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGuestId() {
        return guestId;
    }

    public void setGuestId(Long guestId) {
        this.guestId = guestId;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
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

    public ServiceRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
