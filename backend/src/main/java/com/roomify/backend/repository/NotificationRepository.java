package com.roomify.backend.repository;

import com.roomify.backend.entity.Notification;
import com.roomify.backend.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("""
        SELECT n
        FROM Notification n
        WHERE n.targetRole = :role
          AND (
                (:department IS NULL AND n.targetDepartment IS NULL)
                OR
                (:department IS NOT NULL AND (
                    n.targetDepartment IS NULL
                    OR UPPER(n.targetDepartment) = UPPER(:department)
                ))
              )
          AND (:readState IS NULL OR n.isRead = :readState)
        ORDER BY n.createdAt DESC
    """)
    List<Notification> findVisibleForRoleAndDepartment(Role role, String department, Boolean readState);

    @Query("""
        SELECT COUNT(n)
        FROM Notification n
        WHERE n.targetRole = :role
          AND n.isRead = false
          AND (
                (:department IS NULL AND n.targetDepartment IS NULL)
                OR
                (:department IS NOT NULL AND (
                    n.targetDepartment IS NULL
                    OR UPPER(n.targetDepartment) = UPPER(:department)
                ))
              )
    """)
    long countUnreadForRoleAndDepartment(Role role, String department);
}
