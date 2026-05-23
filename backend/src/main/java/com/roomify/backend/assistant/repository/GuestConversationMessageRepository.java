package com.roomify.backend.assistant.repository;

import com.roomify.backend.assistant.entity.ConversationParticipantRole;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestConversationMessageRepository extends JpaRepository<GuestConversationMessage, Long> {

    @EntityGraph(attributePaths = { "senderUser", "senderUser.staff", "senderGuest", "serviceRequest" })
    List<GuestConversationMessage> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);

    @EntityGraph(attributePaths = { "senderUser", "senderUser.staff", "senderGuest", "serviceRequest" })
    Optional<GuestConversationMessage> findTopByConversation_IdOrderByCreatedAtDesc(Long conversationId);

    boolean existsByConversation_IdAndSenderRoleAndCreatedAtAfter(
            Long conversationId,
            ConversationParticipantRole senderRole,
            LocalDateTime createdAt);
}
