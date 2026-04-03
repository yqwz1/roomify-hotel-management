package com.roomify.backend.repository;

import com.roomify.backend.entity.Notification;
import com.roomify.backend.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTargetRoleOrderByCreatedAtDesc(Role role);
}
