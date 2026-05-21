package com.roomify.backend.notification.dto;

public record EmailNotificationStatsResponse(
        long pending,
        long processing,
        long sent,
        long failed) {
}
