package com.roomify.backend.assistant.dto;

import com.roomify.backend.assistant.entity.QuickActionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ConversationQuickActionRequest {

    @NotNull(message = "Quick action is required")
    private QuickActionType action;

    @Size(max = 1000, message = "Quick action body cannot exceed 1000 characters")
    private String body;

    @Size(max = 10, message = "Detected language cannot exceed 10 characters")
    private String detectedLanguage;

    public QuickActionType getAction() {
        return action;
    }

    public void setAction(QuickActionType action) {
        this.action = action;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getDetectedLanguage() {
        return detectedLanguage;
    }

    public void setDetectedLanguage(String detectedLanguage) {
        this.detectedLanguage = detectedLanguage;
    }
}
