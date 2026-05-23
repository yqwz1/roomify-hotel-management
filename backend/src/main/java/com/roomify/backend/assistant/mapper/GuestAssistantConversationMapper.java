package com.roomify.backend.assistant.mapper;

import com.roomify.backend.assistant.dto.ConversationDetailResponse;
import com.roomify.backend.assistant.dto.ConversationMessageResponse;
import com.roomify.backend.assistant.dto.ConversationSummaryResponse;
import com.roomify.backend.assistant.entity.ConversationParticipantRole;
import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class GuestAssistantConversationMapper {

    public ConversationSummaryResponse toSummary(
            GuestConversation conversation,
            boolean staffOnline,
            int onlineStaffCount) {
        return new ConversationSummaryResponse(
                conversation.getPublicId().toString(),
                conversation.getStatus(),
                conversation.getSubject(),
                conversation.getPreferredLanguage(),
                conversation.getGuest() != null ? conversation.getGuest().getName() : null,
                conversation.getGuest() != null ? conversation.getGuest().getId() : null,
                conversation.getRoom() != null ? conversation.getRoom().getRoomNumber() : null,
                conversation.getRoom() != null ? conversation.getRoom().getId() : null,
                conversation.getReservation() != null ? conversation.getReservation().getConfirmationNumber() : null,
                conversation.getReservation() != null ? conversation.getReservation().getId() : null,
                conversation.getReservation() != null && conversation.getReservation().getStatus() != null
                        ? conversation.getReservation().getStatus().name()
                        : null,
                conversation.getServiceRequest() != null ? conversation.getServiceRequest().getId() : null,
                resolveAssignedStaffName(conversation),
                conversation.getLastMessagePreview(),
                conversation.getLastMessageAt(),
                conversation.getUnreadGuestCount(),
                conversation.getUnreadStaffCount(),
                conversation.isAiFallbackEnabled(),
                conversation.isAiHandled(),
                staffOnline,
                onlineStaffCount,
                conversation.getResolvedAt(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt());
    }

    public ConversationMessageResponse toMessage(GuestConversationMessage message) {
        return new ConversationMessageResponse(
                message.getId(),
                message.getSenderRole(),
                resolveSenderDisplayName(message),
                message.getOriginalBody(),
                message.getDetectedLanguage(),
                message.getArabicTranslation(),
                message.getEnglishTranslation(),
                message.getGuestLocalizedBody(),
                message.getGuestLocalizedLanguage(),
                message.getServiceRequest() != null ? message.getServiceRequest().getId() : null,
                message.isAiGenerated(),
                message.getQuickActionType(),
                message.getMessageStatus(),
                message.getDeliveredAt(),
                message.getReadByGuestAt(),
                message.getReadByStaffAt(),
                message.getCreatedAt());
    }

    public ConversationDetailResponse toDetail(
            GuestConversation conversation,
            List<GuestConversationMessage> messages,
            boolean staffOnline,
            int onlineStaffCount) {
        List<ConversationMessageResponse> mappedMessages = messages.stream()
                .map(this::toMessage)
                .toList();
        return new ConversationDetailResponse(
                toSummary(conversation, staffOnline, onlineStaffCount),
                mappedMessages);
    }

    private String resolveAssignedStaffName(GuestConversation conversation) {
        if (conversation.getAssignedStaffUser() == null) {
            return null;
        }
        if (conversation.getAssignedStaffUser().getStaff() != null
                && conversation.getAssignedStaffUser().getStaff().getName() != null
                && !conversation.getAssignedStaffUser().getStaff().getName().isBlank()) {
            return conversation.getAssignedStaffUser().getStaff().getName();
        }
        return conversation.getAssignedStaffUser().getEmail();
    }

    private String resolveSenderDisplayName(GuestConversationMessage message) {
        if (message.getSenderRole() == ConversationParticipantRole.AI) {
            return "Roomify Assistant";
        }
        if (message.getSenderRole() == ConversationParticipantRole.GUEST && message.getSenderGuest() != null) {
            return message.getSenderGuest().getName();
        }
        if (message.getSenderUser() != null) {
            if (message.getSenderUser().getStaff() != null
                    && message.getSenderUser().getStaff().getName() != null
                    && !message.getSenderUser().getStaff().getName().isBlank()) {
                return message.getSenderUser().getStaff().getName();
            }
            return message.getSenderUser().getEmail();
        }
        return message.getSenderRole().name();
    }
}
