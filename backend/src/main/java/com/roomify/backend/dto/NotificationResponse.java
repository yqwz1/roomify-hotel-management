package com.roomify.backend.dto;

import com.roomify.backend.entity.Notification;
import com.roomify.backend.entity.NotificationEventType;
import com.roomify.backend.user.Role;
import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private NotificationEventType eventType;
    private Role targetRole;
    private String targetDepartment;
    private String recipientEmail;
    private String title;
    private String message;
    private String referenceType;
    private String referenceId;
    private boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.id = notification.getId();
        response.eventType = notification.getEventType();
        response.targetRole = notification.getTargetRole();
        response.targetDepartment = notification.getTargetDepartment();
        response.recipientEmail = notification.getRecipientEmail();
        response.title = notification.getTitle();
        response.message = notification.getMessage();
        response.referenceType = notification.getReferenceType();
        response.referenceId = notification.getReferenceId();
        response.read = notification.isRead();
        response.readAt = notification.getReadAt();
        response.createdAt = notification.getCreatedAt();
        return response;
    }

    public Long getId() {
        return id;
    }

    public NotificationEventType getEventType() {
        return eventType;
    }

    public Role getTargetRole() {
        return targetRole;
    }

    public String getTargetDepartment() {
        return targetDepartment;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public boolean isRead() {
        return read;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
