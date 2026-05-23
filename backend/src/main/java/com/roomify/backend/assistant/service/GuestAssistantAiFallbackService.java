package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.entity.ConversationParticipantRole;
import com.roomify.backend.assistant.entity.ConversationStatus;
import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import com.roomify.backend.assistant.entity.MessageStatus;
import com.roomify.backend.assistant.repository.GuestConversationMessageRepository;
import com.roomify.backend.assistant.repository.GuestConversationRepository;
import com.roomify.backend.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GuestAssistantAiFallbackService {

    private final GuestConversationRepository conversationRepository;
    private final GuestConversationMessageRepository messageRepository;
    private final GuestAssistantAiService aiService;
    private final GuestAssistantTranslationService translationService;
    private final GuestAssistantRealtimeService realtimeService;

    @Value("${roomify.guest-assistant.ai-timeout-ms:15000}")
    private long aiTimeoutMs;

    public void scheduleFallback(Long conversationId, Long guestMessageId) {
        CompletableFuture.runAsync(
                () -> sendFallbackIfStillPending(conversationId, guestMessageId),
                CompletableFuture.delayedExecutor(Math.max(aiTimeoutMs, 1000L), TimeUnit.MILLISECONDS));
    }

    @Transactional
    public void sendFallbackIfStillPending(Long conversationId, Long guestMessageId) {
        GuestConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
        if (!conversation.isAiFallbackEnabled() || conversation.getStatus() == ConversationStatus.RESOLVED) {
            return;
        }

        GuestConversationMessage guestMessage = messageRepository.findById(guestMessageId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation message not found with id: " + guestMessageId));

        boolean hasStaffReply = messageRepository.existsByConversation_IdAndSenderRoleAndCreatedAtAfter(
                conversationId,
                ConversationParticipantRole.STAFF,
                guestMessage.getCreatedAt());
        boolean hasAiReply = messageRepository.existsByConversation_IdAndSenderRoleAndCreatedAtAfter(
                conversationId,
                ConversationParticipantRole.AI,
                guestMessage.getCreatedAt());

        if (hasStaffReply || hasAiReply) {
            return;
        }

        GuestAssistantAiReply aiReply = aiService.generateReply(conversation, guestMessage);
        String replyBody = aiReply.body() == null || aiReply.body().isBlank()
                ? "Thank you for your message. A staff member will continue assisting you as soon as possible."
                : aiReply.body().trim();
        String sourceLanguage = aiReply.sourceLanguage() == null || aiReply.sourceLanguage().isBlank()
                ? "en"
                : aiReply.sourceLanguage();
        GuestAssistantTranslationBundle bundle = translationService.translateIncoming(replyBody, sourceLanguage);

        GuestConversationMessage aiMessage = new GuestConversationMessage();
        aiMessage.setConversation(conversation);
        aiMessage.setSenderRole(ConversationParticipantRole.AI);
        aiMessage.setOriginalBody(replyBody);
        aiMessage.setDetectedLanguage(bundle.detectedLanguage());
        aiMessage.setArabicTranslation(bundle.arabicText());
        aiMessage.setEnglishTranslation(bundle.englishText());
        aiMessage.setGuestLocalizedBody(translationService.translateToGuestLanguage(
                replyBody,
                bundle.detectedLanguage(),
                conversation.getPreferredLanguage()));
        aiMessage.setGuestLocalizedLanguage(conversation.getPreferredLanguage());
        aiMessage.setAiGenerated(true);
        aiMessage.setMessageStatus(MessageStatus.DELIVERED);
        aiMessage.setDeliveredAt(LocalDateTime.now());
        messageRepository.save(aiMessage);

        conversation.setAiHandled(true);
        conversation.setUnreadGuestCount(conversation.getUnreadGuestCount() + 1);
        conversation.setLastMessagePreview(abbreviate(replyBody));
        conversation.setLastMessageAt(aiMessage.getCreatedAt());
        conversationRepository.save(conversation);

        realtimeService.notifyConversationChanged(conversation, aiMessage, "MESSAGE_CREATED");
    }

    private String abbreviate(String text) {
        if (text == null) {
            return null;
        }
        String normalized = text.trim();
        if (normalized.length() <= 280) {
            return normalized;
        }
        return normalized.substring(0, 277) + "...";
    }
}
