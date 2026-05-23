package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.dto.ConversationCreateRequest;
import com.roomify.backend.assistant.dto.ConversationDetailResponse;
import com.roomify.backend.assistant.dto.ConversationMessageCreateRequest;
import com.roomify.backend.assistant.dto.ConversationMessageResponse;
import com.roomify.backend.assistant.dto.ConversationQuickActionRequest;
import com.roomify.backend.assistant.dto.ConversationReplyRequest;
import com.roomify.backend.assistant.dto.ConversationSummaryResponse;
import com.roomify.backend.assistant.entity.ConversationParticipantRole;
import com.roomify.backend.assistant.entity.ConversationStatus;
import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import com.roomify.backend.assistant.entity.MessageStatus;
import com.roomify.backend.assistant.entity.QuickActionType;
import com.roomify.backend.assistant.mapper.GuestAssistantConversationMapper;
import com.roomify.backend.assistant.repository.GuestConversationMessageRepository;
import com.roomify.backend.assistant.repository.GuestConversationRepository;
import com.roomify.backend.dto.ServiceRequestCreateRequest;
import com.roomify.backend.dto.ServiceRequestResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.ServiceRequest;
import com.roomify.backend.entity.ServiceRequestPriority;
import com.roomify.backend.entity.ServiceRequestType;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.ServiceRequestRepository;
import com.roomify.backend.service.AuditService;
import com.roomify.backend.service.GuestReservationService;
import com.roomify.backend.service.ServiceRequestService;
import com.roomify.backend.user.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class GuestAssistantConversationService {

    private final GuestConversationRepository conversationRepository;
    private final GuestConversationMessageRepository messageRepository;
    private final ReservationRepository reservationRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final GuestAssistantAuthService authService;
    private final GuestAssistantTranslationService translationService;
    private final GuestAssistantConversationMapper mapper;
    private final GuestAssistantRealtimeService realtimeService;
    private final GuestAssistantNotificationService notificationService;
    private final GuestAssistantAiService aiService;
    private final GuestAssistantAiFallbackService aiFallbackService;
    private final GuestAssistantPresenceService presenceService;
    private final ServiceRequestService serviceRequestService;
    private final GuestReservationService guestReservationService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> listGuestConversations() {
        List<Long> guestIds = authService.getAuthenticatedGuestIds();
        return conversationRepository.findAllByGuest_IdInOrderByLastMessageAtDesc(guestIds).stream()
                .map(this::toSummary)
                .toList();
    }

    public ConversationDetailResponse createGuestConversation(ConversationCreateRequest request) {
        ConversationContext context = resolveConversationContext(request);

        GuestConversation conversation = new GuestConversation();
        conversation.setGuest(context.guest());
        conversation.setReservation(context.reservation());
        conversation.setRoom(context.room());
        conversation.setServiceRequest(context.serviceRequest());
        conversation.setSubject(normalizeSubject(request.getSubject()));
        conversation.setPreferredLanguage(normalizeLanguage(request.getPreferredLanguage(), "en"));
        conversation.setAiFallbackEnabled(request.getAiFallbackEnabled() == null || request.getAiFallbackEnabled());
        conversation.setStatus(presenceService.isSupportOnline() ? ConversationStatus.ACTIVE : ConversationStatus.PENDING);
        conversation.setLastMessageAt(LocalDateTime.now());
        GuestConversation saved = conversationRepository.save(conversation);

        auditService.log(
                "GUEST_ASSISTANT_CONVERSATION_CREATED",
                "GuestConversation#" + saved.getPublicId(),
                "guestId=" + saved.getGuest().getId());

        return mapper.toDetail(saved, List.of(), presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse getGuestConversationDetail(String publicId) {
        GuestConversation conversation = requireGuestConversation(publicId);
        List<GuestConversationMessage> messages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        return mapper.toDetail(conversation, messages, presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    public ConversationMessageResponse sendGuestMessage(String publicId, ConversationMessageCreateRequest request) {
        GuestConversation conversation = requireGuestConversation(publicId);
        GuestConversationMessage message = appendGuestMessage(
                conversation,
                request.getBody(),
                request.getDetectedLanguage(),
                null,
                true);
        return mapper.toMessage(message);
    }

    public ConversationDetailResponse runQuickAction(String publicId, ConversationQuickActionRequest request) {
        GuestConversation conversation = requireGuestConversation(publicId);
        ServiceRequest linkedRequest = createServiceRequestForQuickAction(conversation, request);
        GuestConversationMessage guestMessage = appendGuestMessage(
                conversation,
                resolveQuickActionBody(request.getAction(), request.getBody()),
                request.getDetectedLanguage(),
                linkedRequest,
                false);
        guestMessage.setQuickActionType(request.getAction());
        messageRepository.save(guestMessage);

        String assistantReply;
        if (request.getAction() == QuickActionType.ASK_AI) {
            GuestAssistantAiReply aiReply = aiService.generateReply(conversation, guestMessage);
            assistantReply = aiReply.body();
        } else {
            assistantReply = buildQuickActionAcknowledgement(request.getAction(), linkedRequest);
        }

        appendAssistantMessage(conversation, assistantReply, request.getAction());

        auditService.log(
                "GUEST_ASSISTANT_QUICK_ACTION",
                "GuestConversation#" + conversation.getPublicId(),
                "action=" + request.getAction());

        List<GuestConversationMessage> messages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        return mapper.toDetail(conversation, messages, presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    public ConversationDetailResponse markGuestRead(String publicId) {
        GuestConversation conversation = requireGuestConversation(publicId);
        List<GuestConversationMessage> messages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        LocalDateTime now = LocalDateTime.now();
        boolean updated = false;
        for (GuestConversationMessage message : messages) {
            if (message.getSenderRole() != ConversationParticipantRole.GUEST && message.getReadByGuestAt() == null) {
                message.setReadByGuestAt(now);
                message.setMessageStatus(MessageStatus.SEEN);
                updated = true;
            }
        }
        if (updated) {
            messageRepository.saveAll(messages);
        }
        conversation.setUnreadGuestCount(0);
        conversationRepository.save(conversation);
        realtimeService.notifyConversationChanged(conversation, null, "READ_UPDATED");
        return mapper.toDetail(conversation, messages, presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> listStaffConversations(ConversationStatus status) {
        authService.requireCurrentSupportUser();
        List<GuestConversation> conversations = status == null
                ? conversationRepository.findAllByOrderByLastMessageAtDesc()
                : conversationRepository.findAllByStatusOrderByLastMessageAtDesc(status);
        return conversations.stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse getStaffConversationDetail(String publicId) {
        GuestConversation conversation = requireStaffConversation(publicId);
        List<GuestConversationMessage> messages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        return mapper.toDetail(conversation, messages, presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    public ConversationMessageResponse sendStaffReply(String publicId, ConversationReplyRequest request) {
        GuestConversation conversation = requireStaffConversation(publicId);
        User supportUser = authService.requireCurrentSupportUser();
        GuestAssistantTranslationBundle bundle = translationService.translateIncoming(
                request.getBody().trim(),
                request.getReplyLanguage());

        GuestConversationMessage message = new GuestConversationMessage();
        message.setConversation(conversation);
        message.setSenderRole(ConversationParticipantRole.STAFF);
        message.setSenderUser(supportUser);
        message.setOriginalBody(request.getBody().trim());
        message.setDetectedLanguage(bundle.detectedLanguage());
        message.setArabicTranslation(bundle.arabicText());
        message.setEnglishTranslation(bundle.englishText());
        message.setGuestLocalizedBody(translationService.translateToGuestLanguage(
                request.getBody().trim(),
                bundle.detectedLanguage(),
                conversation.getPreferredLanguage()));
        message.setGuestLocalizedLanguage(conversation.getPreferredLanguage());
        message.setMessageStatus(MessageStatus.DELIVERED);
        message.setDeliveredAt(LocalDateTime.now());
        GuestConversationMessage saved = messageRepository.save(message);

        conversation.setAssignedStaffUser(supportUser);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setResolvedAt(null);
        conversation.setUnreadGuestCount(conversation.getUnreadGuestCount() + 1);
        conversation.setUnreadStaffCount(0);
        conversation.setLastMessagePreview(abbreviate(request.getBody()));
        conversation.setLastMessageAt(saved.getCreatedAt());
        conversationRepository.save(conversation);

        notificationService.notifyGuestReply(conversation, saved);
        realtimeService.notifyConversationChanged(conversation, saved, "MESSAGE_CREATED");
        auditService.log(
                "GUEST_ASSISTANT_SUPPORT_REPLY",
                "GuestConversation#" + conversation.getPublicId(),
                "supportUserId=" + supportUser.getId());
        return mapper.toMessage(saved);
    }

    public ConversationDetailResponse markStaffRead(String publicId) {
        GuestConversation conversation = requireStaffConversation(publicId);
        User supportUser = authService.requireCurrentSupportUser();
        List<GuestConversationMessage> messages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        LocalDateTime now = LocalDateTime.now();
        boolean updated = false;
        for (GuestConversationMessage message : messages) {
            if (message.getSenderRole() == ConversationParticipantRole.GUEST && message.getReadByStaffAt() == null) {
                message.setReadByStaffAt(now);
                message.setMessageStatus(MessageStatus.SEEN);
                updated = true;
            }
        }
        if (updated) {
            messageRepository.saveAll(messages);
        }
        if (conversation.getAssignedStaffUser() == null) {
            conversation.setAssignedStaffUser(supportUser);
        }
        conversation.setUnreadStaffCount(0);
        conversationRepository.save(conversation);
        realtimeService.notifyConversationChanged(conversation, null, "READ_UPDATED");
        return mapper.toDetail(conversation, messages, presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    public ConversationSummaryResponse resolveConversation(String publicId) {
        GuestConversation conversation = requireStaffConversation(publicId);
        conversation.setStatus(ConversationStatus.RESOLVED);
        conversation.setResolvedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        realtimeService.notifyConversationChanged(conversation, null, "CONVERSATION_RESOLVED");
        auditService.log(
                "GUEST_ASSISTANT_CONVERSATION_RESOLVED",
                "GuestConversation#" + conversation.getPublicId(),
                "status=RESOLVED");
        return toSummary(conversation);
    }

    public void broadcastTyping(String publicId, boolean typing) {
        GuestConversation conversation = findConversation(publicId);
        String senderEmail = authService.requireAuthenticatedEmail();
        ConversationParticipantRole senderRole = hasSupportRole()
                ? ConversationParticipantRole.STAFF
                : ConversationParticipantRole.GUEST;
        if (senderRole == ConversationParticipantRole.GUEST) {
            authService.assertGuestOwnsConversation(conversation);
        }
        realtimeService.broadcastTyping(conversation, senderRole, typing, senderEmail);
    }

    private GuestConversationMessage appendGuestMessage(
            GuestConversation conversation,
            String body,
            String detectedLanguage,
            ServiceRequest linkedServiceRequest,
            boolean scheduleAiFallback) {
        authService.assertGuestOwnsConversation(conversation);
        Guest guest = authService.requirePrimaryGuest();
        String normalizedBody = body == null ? null : body.trim();
        if (normalizedBody == null || normalizedBody.isBlank()) {
            throw new IllegalArgumentException("Message body is required");
        }

        GuestAssistantTranslationBundle bundle = translationService.translateIncoming(normalizedBody, detectedLanguage);
        GuestConversationMessage message = new GuestConversationMessage();
        message.setConversation(conversation);
        message.setSenderRole(ConversationParticipantRole.GUEST);
        message.setSenderGuest(guest);
        message.setServiceRequest(linkedServiceRequest);
        message.setOriginalBody(normalizedBody);
        message.setDetectedLanguage(bundle.detectedLanguage());
        message.setArabicTranslation(bundle.arabicText());
        message.setEnglishTranslation(bundle.englishText());
        message.setGuestLocalizedBody(normalizedBody);
        message.setGuestLocalizedLanguage(bundle.detectedLanguage());
        message.setMessageStatus(MessageStatus.DELIVERED);
        message.setDeliveredAt(LocalDateTime.now());
        GuestConversationMessage saved = messageRepository.save(message);

        conversation.setPreferredLanguage(bundle.detectedLanguage());
        conversation.setStatus(presenceService.isSupportOnline() ? ConversationStatus.ACTIVE : ConversationStatus.PENDING);
        conversation.setResolvedAt(null);
        conversation.setUnreadStaffCount(conversation.getUnreadStaffCount() + 1);
        conversation.setLastMessagePreview(abbreviate(normalizedBody));
        conversation.setLastMessageAt(saved.getCreatedAt());
        if (linkedServiceRequest != null) {
            conversation.setServiceRequest(linkedServiceRequest);
        }
        conversationRepository.save(conversation);

        notificationService.notifySupportNewMessage(conversation, saved);
        realtimeService.notifyConversationChanged(conversation, saved, "MESSAGE_CREATED");
        auditService.log(
                "GUEST_ASSISTANT_GUEST_MESSAGE",
                "GuestConversation#" + conversation.getPublicId(),
                "guestId=" + guest.getId());

        if (scheduleAiFallback) {
            aiFallbackService.scheduleFallback(conversation.getId(), saved.getId());
        }
        return saved;
    }

    private void appendAssistantMessage(
            GuestConversation conversation,
            String body,
            QuickActionType quickActionType) {
        GuestAssistantTranslationBundle bundle = translationService.translateIncoming(body, "en");
        GuestConversationMessage message = new GuestConversationMessage();
        message.setConversation(conversation);
        message.setSenderRole(ConversationParticipantRole.AI);
        message.setOriginalBody(body);
        message.setDetectedLanguage(bundle.detectedLanguage());
        message.setArabicTranslation(bundle.arabicText());
        message.setEnglishTranslation(bundle.englishText());
        message.setGuestLocalizedBody(translationService.translateToGuestLanguage(
                body,
                bundle.detectedLanguage(),
                conversation.getPreferredLanguage()));
        message.setGuestLocalizedLanguage(conversation.getPreferredLanguage());
        message.setAiGenerated(true);
        message.setQuickActionType(quickActionType);
        message.setMessageStatus(MessageStatus.DELIVERED);
        message.setDeliveredAt(LocalDateTime.now());
        GuestConversationMessage saved = messageRepository.save(message);

        conversation.setAiHandled(true);
        conversation.setUnreadGuestCount(conversation.getUnreadGuestCount() + 1);
        conversation.setLastMessagePreview(abbreviate(body));
        conversation.setLastMessageAt(saved.getCreatedAt());
        conversationRepository.save(conversation);

        realtimeService.notifyConversationChanged(conversation, saved, "MESSAGE_CREATED");
    }

    private ServiceRequest createServiceRequestForQuickAction(
            GuestConversation conversation,
            ConversationQuickActionRequest request) {
        ServiceRequestType serviceType = mapQuickActionToServiceRequestType(request.getAction());
        if (serviceType == null) {
            return null;
        }

        Long roomId = resolveConversationRoomId(conversation);
        ServiceRequestCreateRequest serviceRequestCreateRequest = new ServiceRequestCreateRequest();
        serviceRequestCreateRequest.setRoomId(roomId);
        serviceRequestCreateRequest.setServiceType(serviceType);
        serviceRequestCreateRequest.setDescription(resolveQuickActionBody(request.getAction(), request.getBody()));
        serviceRequestCreateRequest.setPriority(mapQuickActionPriority(request.getAction()));
        ServiceRequestResponse created = serviceRequestService.createForCurrentGuest(serviceRequestCreateRequest);
        ServiceRequest serviceRequest = serviceRequestRepository.findById(created.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found after creation"));
        conversation.setServiceRequest(serviceRequest);
        if (conversation.getRoom() == null) {
            conversation.setRoom(serviceRequest.getRoom());
        }
        conversationRepository.save(conversation);
        return serviceRequest;
    }

    private Long resolveConversationRoomId(GuestConversation conversation) {
        if (conversation.getRoom() != null && conversation.getRoom().getId() != null) {
            return conversation.getRoom().getId();
        }
        Reservation reservation = findMostRelevantReservation(authService.getAuthenticatedGuestIds());
        if (reservation == null || reservation.getRoom() == null || reservation.getRoom().getId() == null) {
            throw new IllegalArgumentException("An active room is required for this quick action.");
        }
        conversation.setReservation(reservation);
        conversation.setRoom(reservation.getRoom());
        conversationRepository.save(conversation);
        return reservation.getRoom().getId();
    }

    private ConversationSummaryResponse toSummary(GuestConversation conversation) {
        return mapper.toSummary(conversation, presenceService.isSupportOnline(), presenceService.getSupportOnlineCount());
    }

    private GuestConversation requireGuestConversation(String publicId) {
        GuestConversation conversation = findConversation(publicId);
        authService.assertGuestOwnsConversation(conversation);
        return conversation;
    }

    private GuestConversation requireStaffConversation(String publicId) {
        authService.requireCurrentSupportUser();
        return findConversation(publicId);
    }

    private GuestConversation findConversation(String publicId) {
        return conversationRepository.findByPublicId(parsePublicId(publicId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + publicId));
    }

    private UUID parsePublicId(String publicId) {
        try {
            return UUID.fromString(publicId);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid conversation identifier");
        }
    }

    private ConversationContext resolveConversationContext(ConversationCreateRequest request) {
        List<Long> guestIds = authService.getAuthenticatedGuestIds();
        Guest primaryGuest = authService.requirePrimaryGuest();
        ServiceRequest serviceRequest = null;
        if (request.getServiceRequestId() != null) {
            serviceRequest = serviceRequestRepository.findById(request.getServiceRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service request not found: " + request.getServiceRequestId()));
            if (serviceRequest.getGuestId() == null || !guestIds.contains(serviceRequest.getGuestId())) {
                throw new AccessDeniedException("Service request access denied for authenticated guest");
            }
        }

        Reservation reservation = null;
        if (request.getReservationId() != null) {
            reservation = reservationRepository.findById(request.getReservationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + request.getReservationId()));
            if (reservation.getGuestId() == null || !guestIds.contains(reservation.getGuestId())) {
                throw new AccessDeniedException("Reservation access denied for authenticated guest");
            }
        } else if (request.getRoomId() != null) {
            reservation = guestReservationService.requireActiveGuestReservationForRoom(request.getRoomId());
        } else {
            reservation = findMostRelevantReservation(guestIds);
        }

        if (!isCheckedInReservation(reservation, LocalDate.now())) {
            throw new IllegalArgumentException("A checked-in reservation is required.");
        }

        Guest guest = reservation != null && reservation.getGuest() != null
                ? reservation.getGuest()
                : serviceRequest != null && serviceRequest.getGuest() != null
                        ? serviceRequest.getGuest()
                        : primaryGuest;
        Room room = reservation != null && reservation.getRoom() != null
                ? reservation.getRoom()
                : serviceRequest != null ? serviceRequest.getRoom() : null;

        return new ConversationContext(guest, reservation, room, serviceRequest);
    }

    private Reservation findMostRelevantReservation(List<Long> guestIds) {
        LocalDate today = LocalDate.now();
        return guestIds.stream()
                .flatMap(guestId -> reservationRepository.findByGuest_Id(guestId).stream())
                .filter(reservation -> isCheckedInReservation(reservation, today))
                .sorted(Comparator.comparing(Reservation::getCheckInDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .findFirst()
                .orElse(null);
    }

    private boolean isCheckedInReservation(Reservation reservation, LocalDate today) {
        if (reservation == null || reservation.getRoom() == null || reservation.getRoom().getId() == null) {
            return false;
        }
        if (reservation.getCheckOutDate() == null || reservation.getCheckOutDate().isBefore(today)) {
            return false;
        }
        return reservation.getStatus() == ReservationStatus.CHECKED_IN;
    }

    private ServiceRequestType mapQuickActionToServiceRequestType(QuickActionType action) {
        return switch (action) {
            case ROOM_SERVICE -> ServiceRequestType.FOOD_DELIVERY;
            case HOUSEKEEPING -> ServiceRequestType.ROOM_CLEANING;
            case MAINTENANCE -> ServiceRequestType.MAINTENANCE;
            default -> null;
        };
    }

    private ServiceRequestPriority mapQuickActionPriority(QuickActionType action) {
        return switch (action) {
            case MAINTENANCE -> ServiceRequestPriority.HIGH;
            default -> ServiceRequestPriority.MEDIUM;
        };
    }

    private String resolveQuickActionBody(QuickActionType action, String customBody) {
        if (customBody != null && !customBody.trim().isBlank()) {
            return customBody.trim();
        }
        return switch (action) {
            case ROOM_SERVICE -> "Please arrange room service assistance for my room.";
            case HOUSEKEEPING -> "Please send housekeeping to my room.";
            case MAINTENANCE -> "There is a maintenance issue in my room that needs attention.";
            case TAXI -> "I would like help arranging a taxi.";
            case RESTAURANT -> "I would like restaurant or dining assistance.";
            case ASK_AI -> "I need help from the assistant.";
            case CALL_RECEPTION -> "Please have reception contact me.";
        };
    }

    private String buildQuickActionAcknowledgement(QuickActionType action, ServiceRequest serviceRequest) {
        return switch (action) {
            case ROOM_SERVICE -> "Your room service request has been logged. The hotel team will continue with you shortly.";
            case HOUSEKEEPING -> "Housekeeping has been requested. A team member will review it shortly.";
            case MAINTENANCE -> "Your maintenance request has been logged and shared with the hotel team.";
            case TAXI -> "Your taxi request has been noted. Reception can continue with pickup details.";
            case RESTAURANT -> "Your dining request has been noted. A staff member can help with restaurant details.";
            case ASK_AI -> "How can I assist you with your stay today?";
            case CALL_RECEPTION -> "Reception has been notified through the guest assistant conversation.";
        };
    }

    private String normalizeLanguage(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "ar", "en", "fr", "tr" -> normalized;
            default -> fallback;
        };
    }

    private String normalizeSubject(String subject) {
        if (subject == null) {
            return null;
        }
        String normalized = subject.trim();
        return normalized.isBlank() ? null : normalized;
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

    private boolean hasSupportRole() {
        try {
            authService.requireCurrentSupportUser();
            return true;
        } catch (AccessDeniedException exception) {
            return false;
        }
    }

    private record ConversationContext(
            Guest guest,
            Reservation reservation,
            Room room,
            ServiceRequest serviceRequest) {
    }
}
