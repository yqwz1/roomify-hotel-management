package com.roomify.backend.repository;

import com.roomify.backend.entity.Notification;
import com.roomify.backend.user.Role;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTargetRoleOrderByCreatedAtDesc(Role role);

    List<Notification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
}
