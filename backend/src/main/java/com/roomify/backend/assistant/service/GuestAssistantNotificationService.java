package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import com.roomify.backend.entity.NotificationEventType;
import com.roomify.backend.service.NotificationService;
import com.roomify.backend.user.Role;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuestAssistantNotificationService {

    private final NotificationService notificationService;

    public void notifySupportNewMessage(GuestConversation conversation, GuestConversationMessage message) {
        String roomNumber = conversation.getRoom() != null ? conversation.getRoom().getRoomNumber() : "Unassigned";
        String guestName = conversation.getGuest() != null ? conversation.getGuest().getName() : "Guest";
        notificationService.createNotification(
                NotificationEventType.GUEST_ASSISTANT_MESSAGE,
                Role.STAFF,
                null,
                "New guest assistant message",
                String.format(
                        Locale.ROOT,
                        "%s in room %s sent a new assistant message.",
                        guestName,
                        roomNumber),
                "GUEST_CONVERSATION",
                conversation.getPublicId().toString());
    }

    public void notifyGuestReply(GuestConversation conversation, GuestConversationMessage message) {
        if (conversation.getGuest() == null || conversation.getGuest().getEmail() == null) {
            return;
        }
        notificationService.createDirectNotification(
                NotificationEventType.GUEST_ASSISTANT_REPLY,
                conversation.getGuest().getEmail(),
                "New reply from Roomify",
                message.getOriginalBody(),
                "GUEST_CONVERSATION",
                conversation.getPublicId().toString());
    }
}
