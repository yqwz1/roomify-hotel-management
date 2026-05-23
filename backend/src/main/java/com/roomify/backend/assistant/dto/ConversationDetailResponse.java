package com.roomify.backend.assistant.dto;

import java.util.List;

public record ConversationDetailResponse(
        ConversationSummaryResponse conversation,
        List<ConversationMessageResponse> messages) {
}
