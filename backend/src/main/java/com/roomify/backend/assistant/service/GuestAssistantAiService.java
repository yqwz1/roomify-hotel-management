package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;

public interface GuestAssistantAiService {

    GuestAssistantAiReply generateReply(GuestConversation conversation, GuestConversationMessage guestMessage);
}
