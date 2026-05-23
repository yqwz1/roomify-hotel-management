package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.dto.ConversationRealtimeEventResponse;
import com.roomify.backend.assistant.dto.ConversationSummaryResponse;
import com.roomify.backend.assistant.entity.ConversationParticipantRole;
import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import com.roomify.backend.assistant.mapper.GuestAssistantConversationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuestAssistantRealtimeService {

    private static final String USER_QUEUE = "/queue/assistant-events";

    private final SimpMessagingTemplate messagingTemplate;
    private final GuestAssistantConversationMapper mapper;
    private final GuestAssistantPresenceService presenceService;

    public void notifyConversationChanged(
            GuestConversation conversation,
            GuestConversationMessage message,
            String eventType) {
        ConversationSummaryResponse summary = mapper.toSummary(
                conversation,
                presenceService.isSupportOnline(),
                presenceService.getSupportOnlineCount());
        ConversationRealtimeEventResponse event = new ConversationRealtimeEventResponse(
                eventType,
                summary,
                message != null ? mapper.toMessage(message) : null,
                null,
                null,
                null,
                summary.staffOnline(),
                summary.onlineStaffCount());
        sendToGuest(conversation, event);
        broadcastToSupport(event);
    }

    public void broadcastTyping(
            GuestConversation conversation,
            ConversationParticipantRole senderRole,
            boolean typing,
            String senderEmail) {
        ConversationRealtimeEventResponse event = new ConversationRealtimeEventResponse(
                "TYPING",
                mapper.toSummary(
                        conversation,
                        presenceService.isSupportOnline(),
                        presenceService.getSupportOnlineCount()),
                null,
                conversation.getPublicId().toString(),
                senderRole,
                typing,
                presenceService.isSupportOnline(),
                presenceService.getSupportOnlineCount());
        String normalizedSender = senderEmail == null ? null : senderEmail.trim().toLowerCase(java.util.Locale.ROOT);
        if (conversation.getGuest() != null && conversation.getGuest().getEmail() != null
                && !conversation.getGuest().getEmail().equalsIgnoreCase(normalizedSender)) {
            messagingTemplate.convertAndSendToUser(
                    conversation.getGuest().getEmail(),
                    USER_QUEUE,
                    event);
        }
        presenceService.getOnlineSupportEmails().stream()
                .filter(email -> normalizedSender == null || !email.equalsIgnoreCase(normalizedSender))
                .forEach(email -> messagingTemplate.convertAndSendToUser(email, USER_QUEUE, event));
    }

    public void broadcastPresenceSnapshot() {
        ConversationRealtimeEventResponse event = new ConversationRealtimeEventResponse(
                "PRESENCE",
                null,
                null,
                null,
                null,
                null,
                presenceService.isSupportOnline(),
                presenceService.getSupportOnlineCount());
        presenceService.getAllConnectedEmails()
                .forEach(email -> messagingTemplate.convertAndSendToUser(email, USER_QUEUE, event));
    }

    private void sendToGuest(GuestConversation conversation, ConversationRealtimeEventResponse event) {
        if (conversation.getGuest() != null && conversation.getGuest().getEmail() != null) {
            messagingTemplate.convertAndSendToUser(
                    conversation.getGuest().getEmail(),
                    USER_QUEUE,
                    event);
        }
    }

    private void broadcastToSupport(ConversationRealtimeEventResponse event) {
        presenceService.getOnlineSupportEmails()
                .forEach(email -> messagingTemplate.convertAndSendToUser(email, USER_QUEUE, event));
    }
}
