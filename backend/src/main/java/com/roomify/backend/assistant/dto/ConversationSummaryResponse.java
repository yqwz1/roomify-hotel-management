package com.roomify.backend.assistant.dto;

import com.roomify.backend.assistant.entity.ConversationStatus;
import java.time.LocalDateTime;

public record ConversationSummaryResponse(
        String publicId,
        ConversationStatus status,
        String subject,
        String preferredLanguage,
        String guestName,
        Long guestId,
        String roomNumber,
        Long roomId,
        String reservationConfirmationNumber,
        Long reservationId,
        String reservationStatus,
        Long serviceRequestId,
        String assignedStaffName,
        String lastMessagePreview,
        LocalDateTime lastMessageAt,
        int unreadGuestCount,
        int unreadStaffCount,
        boolean aiFallbackEnabled,
        boolean aiHandled,
        boolean staffOnline,
        int onlineStaffCount,
        LocalDateTime resolvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
