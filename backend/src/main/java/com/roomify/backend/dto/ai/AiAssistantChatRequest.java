package com.roomify.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AiAssistantChatRequest(
        @NotBlank(message = "message is required") String message,
        List<AiAssistantChatMessage> history) {
}
