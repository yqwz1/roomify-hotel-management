package com.roomify.backend.assistant.dto;

import com.roomify.backend.assistant.entity.ConversationParticipantRole;
import com.roomify.backend.assistant.entity.MessageStatus;
import com.roomify.backend.assistant.entity.QuickActionType;
import java.time.LocalDateTime;

public record ConversationMessageResponse(
        Long id,
        ConversationParticipantRole senderRole,
        String senderDisplayName,
        String originalBody,
        String detectedLanguage,
        String arabicTranslation,
        String englishTranslation,
        String guestLocalizedBody,
        String guestLocalizedLanguage,
        Long serviceRequestId,
        boolean aiGenerated,
        QuickActionType quickActionType,
        MessageStatus messageStatus,
        LocalDateTime deliveredAt,
        LocalDateTime readByGuestAt,
        LocalDateTime readByStaffAt,
        LocalDateTime createdAt) {
}
