package com.roomify.backend.service;

import com.roomify.backend.dto.NotificationResponse;
import com.roomify.backend.entity.HotelService;
import com.roomify.backend.entity.Notification;
import com.roomify.backend.entity.NotificationEventType;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ServiceCategory;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.NotificationRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listVisibleForCurrentUser(Boolean readState) {
        NotificationViewer viewer = resolveViewer();
        return notificationRepository.findByTargetRoleOrderByCreatedAtDesc(viewer.role())
                .stream()
                .filter(notification -> matchesDepartment(notification.getTargetDepartment(), viewer.department()))
                .filter(notification -> readState == null || notification.isRead() == readState)
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCountForCurrentUser() {
        NotificationViewer viewer = resolveViewer();
        return notificationRepository.findByTargetRoleOrderByCreatedAtDesc(viewer.role())
                .stream()
                .filter(notification -> !notification.isRead())
                .filter(notification -> matchesDepartment(notification.getTargetDepartment(), viewer.department()))
                .count();
    }

    public NotificationResponse markAsRead(Long notificationId) {
        NotificationViewer viewer = resolveViewer();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!canView(notification, viewer.role(), viewer.department())) {
            throw new AccessDeniedException("You cannot update this notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);

            auditService.log(
                    "NOTIFICATION_READ",
                    "Notification#" + notification.getId(),
                    "actor=" + viewer.actor());
        }

        return NotificationResponse.from(notification);
    }

    public NotificationResponse markAsUnread(Long notificationId) {
        NotificationViewer viewer = resolveViewer();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!canView(notification, viewer.role(), viewer.department())) {
            throw new AccessDeniedException("You cannot update this notification");
        }

        if (notification.isRead()) {
            notification.setRead(false);
            notification.setReadAt(null);
            notificationRepository.save(notification);

            auditService.log(
                    "NOTIFICATION_UNREAD",
                    "Notification#" + notification.getId(),
                    "actor=" + viewer.actor());
        }

        return NotificationResponse.from(notification);
    }

    public void notifyServiceRequestCreated(
            Reservation reservation,
            HotelService service,
            int quantity,
            BigDecimal amount) {
        NotificationRoute route = routeForServiceRequest(service.getCategory());

        String title = "New service request";
        String message = String.format(
                Locale.ROOT,
                "Reservation %s requested %s x%d (amount %s)",
                reservation.getConfirmationNumber(),
                service.getName(),
                quantity,
                amount);

        createNotification(
                NotificationEventType.SERVICE_REQUEST_CREATED,
                route.role(),
                route.department(),
                title,
                message,
                "RESERVATION",
                reservation.getConfirmationNumber());
    }

    public void notifyIncompletePayment(
            String confirmationNumber,
            BigDecimal paidAmount,
            BigDecimal remainingAmount) {
        createNotification(
                NotificationEventType.PAYMENT_INCOMPLETE,
                Role.STAFF,
                "FRONT_DESK",
                "Payment incomplete",
                String.format(
                        Locale.ROOT,
                        "Reservation %s paid %s and still has %s outstanding",
                        confirmationNumber,
                        paidAmount,
                        remainingAmount),
                "RESERVATION",
                confirmationNumber);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyPaymentFailed(String confirmationNumber, String reason) {
        createNotification(
                NotificationEventType.PAYMENT_FAILED,
                Role.MANAGER,
                null,
                "Payment failed",
                String.format(
                        Locale.ROOT,
                        "Reservation %s payment failed: %s",
                        confirmationNumber,
                        reason),
                "RESERVATION",
                confirmationNumber);
    }

    public NotificationResponse createNotification(
            NotificationEventType eventType,
            Role targetRole,
            String targetDepartment,
            String title,
            String message,
            String referenceType,
            String referenceId) {
        Notification notification = new Notification();
        notification.setEventType(eventType);
        notification.setTargetRole(targetRole);
        notification.setTargetDepartment(normalize(targetDepartment));
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceType(normalize(referenceType));
        notification.setReferenceId(normalize(referenceId));

        Notification saved = notificationRepository.save(notification);

        auditService.log(
                "NOTIFICATION_CREATED",
                "Notification#" + saved.getId(),
                String.format(
                        Locale.ROOT,
                        "eventType=%s targetRole=%s department=%s reference=%s:%s",
                        saved.getEventType(),
                        saved.getTargetRole(),
                        saved.getTargetDepartment(),
                        saved.getReferenceType(),
                        saved.getReferenceId()));

        return NotificationResponse.from(saved);
    }

    private NotificationRoute routeForServiceRequest(ServiceCategory category) {
        if (category == ServiceCategory.CLEANING) {
            return new NotificationRoute(Role.STAFF, "HOUSEKEEPING");
        }
        if (category == ServiceCategory.FOOD) {
            return new NotificationRoute(Role.STAFF, null);
        }
        return new NotificationRoute(Role.MANAGER, null);
    }

    private NotificationViewer resolveViewer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        Role role = extractRole(authentication);
        String actor = authentication.getName();
        String department = null;

        if (actor != null && !actor.isBlank()) {
            User user = userRepository.findByEmail(actor).orElse(null);
            if (user != null && user.getStaff() != null) {
                department = normalize(user.getStaff().getDepartment());
            }
        }

        return new NotificationViewer(role, department, actor);
    }

    private Role extractRole(Authentication authentication) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            String value = authority.getAuthority();
            if (value != null && value.startsWith("ROLE_")) {
                return Role.valueOf(value.substring("ROLE_".length()).toUpperCase(Locale.ROOT));
            }
            if (value != null) {
                return Role.valueOf(value.toUpperCase(Locale.ROOT));
            }
        }
        throw new AccessDeniedException("No role is present in token");
    }

    private boolean canView(Notification notification, Role role, String department) {
        if (notification.getTargetRole() != role) {
            return false;
        }
        return matchesDepartment(notification.getTargetDepartment(), department);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean matchesDepartment(String targetDepartment, String viewerDepartment) {
        String normalizedTarget = normalizeDepartmentKey(targetDepartment);
        if (normalizedTarget == null) {
            return true;
        }

        String normalizedViewer = normalizeDepartmentKey(viewerDepartment);
        if (normalizedViewer == null) {
            return false;
        }

        return normalizedTarget.equals(normalizedViewer)
                || normalizedTarget.contains(normalizedViewer)
                || normalizedViewer.contains(normalizedTarget);
    }

    private String normalizeDepartmentKey(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }

        return normalized
                .toUpperCase(Locale.ROOT)
                .replace("&", " AND ")
                .replaceAll("[^A-Z0-9]+", "");
    }

    private record NotificationRoute(Role role, String department) {
    }

    private record NotificationViewer(Role role, String department, String actor) {
    }
}
