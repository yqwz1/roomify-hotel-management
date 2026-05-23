package com.roomify.backend.assistant.repository;

import com.roomify.backend.assistant.entity.ConversationStatus;
import com.roomify.backend.assistant.entity.GuestConversation;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestConversationRepository extends JpaRepository<GuestConversation, Long> {

    @EntityGraph(attributePaths = { "guest", "room", "room.roomType", "reservation", "assignedStaffUser", "assignedStaffUser.staff", "serviceRequest" })
    List<GuestConversation> findAllByGuest_IdInOrderByLastMessageAtDesc(Collection<Long> guestIds);

    @EntityGraph(attributePaths = { "guest", "room", "room.roomType", "reservation", "assignedStaffUser", "assignedStaffUser.staff", "serviceRequest" })
    List<GuestConversation> findAllByStatusOrderByLastMessageAtDesc(ConversationStatus status);

    @EntityGraph(attributePaths = { "guest", "room", "room.roomType", "reservation", "assignedStaffUser", "assignedStaffUser.staff", "serviceRequest" })
    List<GuestConversation> findAllByOrderByLastMessageAtDesc();

    @EntityGraph(attributePaths = { "guest", "room", "room.roomType", "reservation", "assignedStaffUser", "assignedStaffUser.staff", "serviceRequest" })
    Optional<GuestConversation> findByPublicId(UUID publicId);
}
