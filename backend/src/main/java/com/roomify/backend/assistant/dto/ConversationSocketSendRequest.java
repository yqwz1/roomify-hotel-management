package com.roomify.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ConversationSocketSendRequest {

    @NotBlank(message = "conversationPublicId is required")
    private String conversationPublicId;

    @NotBlank(message = "Message body is required")
    @Size(max = 4000, message = "Message body cannot exceed 4000 characters")
    private String body;

    @Size(max = 10, message = "Detected language cannot exceed 10 characters")
    private String detectedLanguage;

    public String getConversationPublicId() {
        return conversationPublicId;
    }

    public void setConversationPublicId(String conversationPublicId) {
        this.conversationPublicId = conversationPublicId;
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
