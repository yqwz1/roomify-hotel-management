package com.roomify.backend.assistant.dto;

import com.roomify.backend.assistant.entity.ConversationParticipantRole;

public record ConversationRealtimeEventResponse(
        String eventType,
        ConversationSummaryResponse conversation,
        ConversationMessageResponse message,
        String typingConversationPublicId,
        ConversationParticipantRole typingSenderRole,
        Boolean typing,
        Boolean staffOnline,
        Integer onlineStaffCount) {
}
