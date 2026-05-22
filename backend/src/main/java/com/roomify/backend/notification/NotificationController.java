package com.roomify.backend.notification;

import com.roomify.backend.dto.NotificationResponse;
import com.roomify.backend.notification.dto.EmailNotificationResponse;
import com.roomify.backend.notification.dto.EmailNotificationStatsResponse;
import com.roomify.backend.service.NotificationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationEmailService emailService;

    public NotificationController(
            NotificationService notificationService,
            NotificationEmailService emailService) {
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'GUEST')")
    public ResponseEntity<List<NotificationResponse>> list(@RequestParam(required = false) Boolean read) {
        return ResponseEntity.ok(notificationService.listVisibleForCurrentUser(read));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'GUEST')")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.unreadCountForCurrentUser()));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'GUEST')")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PatchMapping("/{id}/unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'GUEST')")
    public ResponseEntity<NotificationResponse> markAsUnread(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsUnread(id));
    }

    @GetMapping("/email-deliveries")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmailNotificationResponse>> listEmailDeliveries(
            @RequestParam(required = false) String recipient,
            @RequestParam(required = false) NotificationDeliveryStatus status,
            @RequestParam(required = false) NotificationType type) {
        return ResponseEntity.ok(emailService.listEmailNotifications(recipient, status, type)
                .stream()
                .map(EmailNotificationResponse::from)
                .toList());
    }

    @GetMapping("/email-deliveries/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailNotificationStatsResponse> emailDeliveryStats() {
        return ResponseEntity.ok(new EmailNotificationStatsResponse(
                emailService.countByStatus(NotificationDeliveryStatus.PENDING),
                emailService.countByStatus(NotificationDeliveryStatus.PROCESSING),
                emailService.countByStatus(NotificationDeliveryStatus.SENT),
                emailService.countByStatus(NotificationDeliveryStatus.FAILED)));
    }

    @PostMapping("/email-deliveries/{id}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailNotificationResponse> retry(@PathVariable Long id) {
        EmailNotificationResponse response = emailService.retry(id)
                .map(EmailNotificationResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Email notification not found"));
        return ResponseEntity.ok(response);
    }
}
