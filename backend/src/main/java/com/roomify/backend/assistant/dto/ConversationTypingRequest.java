package com.roomify.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public class ConversationTypingRequest {

    @NotBlank(message = "conversationPublicId is required")
    private String conversationPublicId;

    private boolean typing;

    public String getConversationPublicId() {
        return conversationPublicId;
    }

    public void setConversationPublicId(String conversationPublicId) {
        this.conversationPublicId = conversationPublicId;
    }

    public boolean isTyping() {
        return typing;
    }

    public void setTyping(boolean typing) {
        this.typing = typing;
    }
}
