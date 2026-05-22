package com.roomify.backend.notification.dto;

import com.roomify.backend.notification.EmailNotification;
import com.roomify.backend.notification.NotificationDeliveryStatus;
import com.roomify.backend.notification.NotificationType;
import java.time.LocalDateTime;

public record EmailNotificationResponse(
        Long id,
        String recipient,
        NotificationType type,
        NotificationDeliveryStatus status,
        String subject,
        int attemptCount,
        LocalDateTime createdAt,
        LocalDateTime sentAt,
        LocalDateTime lastAttemptAt,
        String errorMessage) {

    public static EmailNotificationResponse from(EmailNotification notification) {
        return new EmailNotificationResponse(
                notification.getId(),
                notification.getRecipient(),
                notification.getType(),
                notification.getStatus(),
                notification.getSubject(),
                notification.getAttemptCount(),
                notification.getCreatedAt(),
                notification.getSentAt(),
                notification.getLastAttemptAt(),
                notification.getErrorMessage());
    }
}
