package com.roomify.backend.assistant.entity;

import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.Room;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "guest_conversations",
        indexes = {
                @Index(name = "idx_guest_conversations_guest_id", columnList = "guest_id"),
                @Index(name = "idx_guest_conversations_status_last_message", columnList = "status,last_message_at"),
                @Index(name = "idx_guest_conversations_last_message_at", columnList = "last_message_at"),
                @Index(name = "idx_guest_conversations_room_id", columnList = "room_id"),
                @Index(name = "idx_guest_conversations_reservation_id", columnList = "reservation_id")
        })
public class GuestConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id")
    private ServiceRequest serviceRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_user_id")
    private User assignedStaffUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(length = 160)
    private String subject;

    @Column(name = "preferred_language", nullable = false, length = 10)
    private String preferredLanguage = "en";

    @Column(name = "ai_fallback_enabled", nullable = false)
    private boolean aiFallbackEnabled = true;

    @Column(name = "ai_handled", nullable = false)
    private boolean aiHandled = false;

    @Column(name = "unread_guest_count", nullable = false)
    private int unreadGuestCount = 0;

    @Column(name = "unread_staff_count", nullable = false)
    private int unreadStaffCount = 0;

    @Column(name = "last_message_preview", length = 280)
    private String lastMessagePreview;

    @Column(name = "last_message_at", nullable = false)
    private LocalDateTime lastMessageAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID();
        }
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (lastMessageAt == null) {
            lastMessageAt = now;
        }
        if (status == null) {
            status = ConversationStatus.ACTIVE;
        }
        if (preferredLanguage == null || preferredLanguage.isBlank()) {
            preferredLanguage = "en";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UUID getPublicId() {
        return publicId;
    }

    public Guest getGuest() {
        return guest;
    }

    public void setGuest(Guest guest) {
        this.guest = guest;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public void setReservation(Reservation reservation) {
        this.reservation = reservation;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public ServiceRequest getServiceRequest() {
        return serviceRequest;
    }

    public void setServiceRequest(ServiceRequest serviceRequest) {
        this.serviceRequest = serviceRequest;
    }

    public User getAssignedStaffUser() {
        return assignedStaffUser;
    }

    public void setAssignedStaffUser(User assignedStaffUser) {
        this.assignedStaffUser = assignedStaffUser;
    }

    public ConversationStatus getStatus() {
        return status;
    }

    public void setStatus(ConversationStatus status) {
        this.status = status;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public boolean isAiFallbackEnabled() {
        return aiFallbackEnabled;
    }

    public void setAiFallbackEnabled(boolean aiFallbackEnabled) {
        this.aiFallbackEnabled = aiFallbackEnabled;
    }

    public boolean isAiHandled() {
        return aiHandled;
    }

    public void setAiHandled(boolean aiHandled) {
        this.aiHandled = aiHandled;
    }

    public int getUnreadGuestCount() {
        return unreadGuestCount;
    }

    public void setUnreadGuestCount(int unreadGuestCount) {
        this.unreadGuestCount = unreadGuestCount;
    }

    public int getUnreadStaffCount() {
        return unreadStaffCount;
    }

    public void setUnreadStaffCount(int unreadStaffCount) {
        this.unreadStaffCount = unreadStaffCount;
    }

    public String getLastMessagePreview() {
        return lastMessagePreview;
    }

    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
