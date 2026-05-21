package com.roomify.backend.notification;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailNotificationRepository extends JpaRepository<EmailNotification, Long> {

    Optional<EmailNotification> findByIdempotencyKey(String idempotencyKey);

    long countByRecipientAndCreatedAtAfter(String recipient, LocalDateTime createdAt);

    long countByRecipientAndTypeAndCreatedAtAfter(String recipient, NotificationType type, LocalDateTime createdAt);

    @Query("""
            select n from EmailNotification n
            where n.status in :statuses
              and n.nextAttemptAt <= :cutoff
              and n.attemptCount < :maxAttempts
            order by n.createdAt asc
            """)
    List<EmailNotification> findDueForDispatch(
            @Param("statuses") Collection<NotificationDeliveryStatus> statuses,
            @Param("cutoff") LocalDateTime cutoff,
            @Param("maxAttempts") int maxAttempts);

    @Query("""
            select n from EmailNotification n
            where (:recipient is null or lower(n.recipient) like lower(concat('%', :recipient, '%')))
              and (:status is null or n.status = :status)
              and (:type is null or n.type = :type)
            order by n.createdAt desc
            """)
    List<EmailNotification> search(
            @Param("recipient") String recipient,
            @Param("status") NotificationDeliveryStatus status,
            @Param("type") NotificationType type);

    @Query("""
            select count(n) from EmailNotification n
            where n.status = :status
            """)
    long countByStatus(@Param("status") NotificationDeliveryStatus status);
}
