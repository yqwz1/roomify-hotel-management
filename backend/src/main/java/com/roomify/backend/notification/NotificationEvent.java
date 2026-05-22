package com.roomify.backend.notification;

import java.util.Map;

public record NotificationEvent(
        NotificationType type,
        String recipient,
        String recipientName,
        String subject,
        String templateName,
        String locale,
        String referenceType,
        String referenceId,
        String idempotencyKey,
        Map<String, Object> templateModel) {
}
