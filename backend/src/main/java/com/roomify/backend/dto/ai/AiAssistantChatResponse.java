package com.roomify.backend.dto.ai;

import java.time.LocalDateTime;
import java.util.List;

public record AiAssistantChatResponse(
        String answer,
        String source,
        boolean fallbackUsed,
        String model,
        String contextSummary,
        List<String> suggestedPrompts,
        LocalDateTime generatedAt) {
}
