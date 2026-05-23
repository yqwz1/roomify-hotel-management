package com.roomify.backend.assistant.entity;

import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.ServiceRequest;
import com.roomify.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "guest_conversation_messages",
        indexes = {
                @Index(name = "idx_guest_conversation_messages_conversation_created", columnList = "conversation_id,created_at"),
                @Index(name = "idx_guest_conversation_messages_sender_role", columnList = "sender_role"),
                @Index(name = "idx_guest_conversation_messages_status", columnList = "message_status")
        })
public class GuestConversationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private GuestConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 20)
    private ConversationParticipantRole senderRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private User senderUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_guest_id")
    private Guest senderGuest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id")
    private ServiceRequest serviceRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_status", nullable = false, length = 20)
    private MessageStatus messageStatus = MessageStatus.SENT;

    @Column(name = "original_body", nullable = false, columnDefinition = "TEXT")
    private String originalBody;

    @Column(name = "detected_language", nullable = false, length = 10)
    private String detectedLanguage;

    @Column(name = "arabic_translation", columnDefinition = "TEXT")
    private String arabicTranslation;

    @Column(name = "english_translation", columnDefinition = "TEXT")
    private String englishTranslation;

    @Column(name = "guest_localized_body", columnDefinition = "TEXT")
    private String guestLocalizedBody;

    @Column(name = "guest_localized_language", length = 10)
    private String guestLocalizedLanguage;

    @Column(name = "ai_generated", nullable = false)
    private boolean aiGenerated = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "quick_action_type", length = 40)
    private QuickActionType quickActionType;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_by_guest_at")
    private LocalDateTime readByGuestAt;

    @Column(name = "read_by_staff_at")
    private LocalDateTime readByStaffAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (messageStatus == null) {
            messageStatus = MessageStatus.SENT;
        }
    }

    public Long getId() {
        return id;
    }

    public GuestConversation getConversation() {
        return conversation;
    }

    public void setConversation(GuestConversation conversation) {
        this.conversation = conversation;
    }

    public ConversationParticipantRole getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(ConversationParticipantRole senderRole) {
        this.senderRole = senderRole;
    }

    public User getSenderUser() {
        return senderUser;
    }

    public void setSenderUser(User senderUser) {
        this.senderUser = senderUser;
    }

    public Guest getSenderGuest() {
        return senderGuest;
    }

    public void setSenderGuest(Guest senderGuest) {
        this.senderGuest = senderGuest;
    }

    public ServiceRequest getServiceRequest() {
        return serviceRequest;
    }

    public void setServiceRequest(ServiceRequest serviceRequest) {
        this.serviceRequest = serviceRequest;
    }

    public MessageStatus getMessageStatus() {
        return messageStatus;
    }

    public void setMessageStatus(MessageStatus messageStatus) {
        this.messageStatus = messageStatus;
    }

    public String getOriginalBody() {
        return originalBody;
    }

    public void setOriginalBody(String originalBody) {
        this.originalBody = originalBody;
    }

    public String getDetectedLanguage() {
        return detectedLanguage;
    }

    public void setDetectedLanguage(String detectedLanguage) {
        this.detectedLanguage = detectedLanguage;
    }

    public String getArabicTranslation() {
        return arabicTranslation;
    }

    public void setArabicTranslation(String arabicTranslation) {
        this.arabicTranslation = arabicTranslation;
    }

    public String getEnglishTranslation() {
        return englishTranslation;
    }

    public void setEnglishTranslation(String englishTranslation) {
        this.englishTranslation = englishTranslation;
    }

    public String getGuestLocalizedBody() {
        return guestLocalizedBody;
    }

    public void setGuestLocalizedBody(String guestLocalizedBody) {
        this.guestLocalizedBody = guestLocalizedBody;
    }

    public String getGuestLocalizedLanguage() {
        return guestLocalizedLanguage;
    }

    public void setGuestLocalizedLanguage(String guestLocalizedLanguage) {
        this.guestLocalizedLanguage = guestLocalizedLanguage;
    }

    public boolean isAiGenerated() {
        return aiGenerated;
    }

    public void setAiGenerated(boolean aiGenerated) {
        this.aiGenerated = aiGenerated;
    }

    public QuickActionType getQuickActionType() {
        return quickActionType;
    }

    public void setQuickActionType(QuickActionType quickActionType) {
        this.quickActionType = quickActionType;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getReadByGuestAt() {
        return readByGuestAt;
    }

    public void setReadByGuestAt(LocalDateTime readByGuestAt) {
        this.readByGuestAt = readByGuestAt;
    }

    public LocalDateTime getReadByStaffAt() {
        return readByStaffAt;
    }

    public void setReadByStaffAt(LocalDateTime readByStaffAt) {
        this.readByStaffAt = readByStaffAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
