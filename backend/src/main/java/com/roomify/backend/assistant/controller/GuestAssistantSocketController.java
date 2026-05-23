package com.roomify.backend.assistant.controller;

import com.roomify.backend.assistant.dto.ConversationMessageCreateRequest;
import com.roomify.backend.assistant.dto.ConversationReplyRequest;
import com.roomify.backend.assistant.dto.ConversationSocketSendRequest;
import com.roomify.backend.assistant.dto.ConversationTypingRequest;
import com.roomify.backend.assistant.service.GuestAssistantConversationService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GuestAssistantSocketController {

    private final GuestAssistantConversationService conversationService;

    @MessageMapping("/guest-assistant.typing")
    public void typing(@Valid ConversationTypingRequest request, Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Authenticated websocket principal is required");
        }
        conversationService.broadcastTyping(request.getConversationPublicId(), request.isTyping());
    }

    @MessageMapping("/guest-assistant.send")
    public void send(@Valid ConversationSocketSendRequest request, Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Authenticated websocket principal is required");
        }
        if (hasSupportRole(principal)) {
            ConversationReplyRequest replyRequest = new ConversationReplyRequest();
            replyRequest.setBody(request.getBody());
            replyRequest.setReplyLanguage(request.getDetectedLanguage());
            conversationService.sendStaffReply(request.getConversationPublicId(), replyRequest);
            return;
        }
        ConversationMessageCreateRequest messageRequest = new ConversationMessageCreateRequest();
        messageRequest.setBody(request.getBody());
        messageRequest.setDetectedLanguage(request.getDetectedLanguage());
        conversationService.sendGuestMessage(request.getConversationPublicId(), messageRequest);
    }

    private boolean hasSupportRole(Principal principal) {
        if (principal instanceof org.springframework.security.core.Authentication authentication) {
            return authentication.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_STAFF".equals(authority.getAuthority())
                            || "ROLE_MANAGER".equals(authority.getAuthority()));
        }
        return false;
    }
}
