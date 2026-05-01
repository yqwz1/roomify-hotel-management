package com.roomify.backend.dto.ai;

import java.util.Map;

public record AskAiFinanceResponse(
        String intent,
        String answer,
        Map<String, Object> metrics,
        String source) {
}
