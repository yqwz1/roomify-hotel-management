package com.roomify.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ConversationReplyRequest {

    @NotBlank(message = "Reply body is required")
    @Size(max = 4000, message = "Reply body cannot exceed 4000 characters")
    private String body;

    @Size(max = 10, message = "Reply language cannot exceed 10 characters")
    private String replyLanguage;

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getReplyLanguage() {
        return replyLanguage;
    }

    public void setReplyLanguage(String replyLanguage) {
        this.replyLanguage = replyLanguage;
    }
}
