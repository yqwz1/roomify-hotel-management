package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.roomify.backend.dto.NotificationResponse;
import com.roomify.backend.entity.HotelService;
import com.roomify.backend.entity.Notification;
import com.roomify.backend.entity.NotificationEventType;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ServiceCategory;
import com.roomify.backend.repository.NotificationRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, userRepository, auditService);
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void markAsReadShouldUpdateStateForAuthorizedDepartment() {
        authenticateAs("staff@roomify.com", "ROLE_STAFF");

        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff User", "FRONT_DESK");
        user.setStaff(staff);

        Notification notification = baseNotification();
        notification.setTargetRole(Role.STAFF);
        notification.setTargetDepartment("FRONT_DESK");
        notification.setRead(false);

        when(userRepository.findByEmail("staff@roomify.com")).thenReturn(Optional.of(user));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(10L);

        assertEquals(10L, response.getId());
        assertEquals(true, response.isRead());
        assertNotNull(response.getReadAt());
        verify(auditService).log(eq("NOTIFICATION_READ"), eq("Notification#10"), contains("staff@roomify.com"));
    }

    @Test
    void markAsUnreadShouldToggleReadStateAndClearTimestamp() {
        authenticateAs("staff@roomify.com", "ROLE_STAFF");

        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff User", "FRONT_DESK");
        user.setStaff(staff);

        Notification notification = baseNotification();
        notification.setTargetRole(Role.STAFF);
        notification.setTargetDepartment("FRONT_DESK");
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());

        when(userRepository.findByEmail("staff@roomify.com")).thenReturn(Optional.of(user));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsUnread(10L);

        assertEquals(false, response.isRead());
        assertNull(response.getReadAt());
        verify(auditService).log(eq("NOTIFICATION_UNREAD"), eq("Notification#10"), contains("staff@roomify.com"));
    }

    @Test
    void markAsReadShouldRejectOtherDepartment() {
        authenticateAs("staff@roomify.com", "ROLE_STAFF");

        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff User", "HOUSEKEEPING");
        user.setStaff(staff);

        Notification notification = baseNotification();
        notification.setTargetRole(Role.STAFF);
        notification.setTargetDepartment("FRONT_DESK");

        when(userRepository.findByEmail("staff@roomify.com")).thenReturn(Optional.of(user));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        assertThrows(AccessDeniedException.class, () -> notificationService.markAsRead(10L));
    }

    @Test
    void listVisibleForCurrentUserShouldFilterByRoleAndDepartment() {
        authenticateAs("staff@roomify.com", "ROLE_STAFF");

        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff User", "Front Desk");
        user.setStaff(staff);

        Notification visible = baseNotification();
        visible.setTargetRole(Role.STAFF);
        visible.setTargetDepartment("FRONT_DESK");

        Notification hidden = baseNotification();
        hidden.setTargetRole(Role.STAFF);
        hidden.setTargetDepartment("HOUSEKEEPING");

        when(userRepository.findByEmail("staff@roomify.com")).thenReturn(Optional.of(user));
        when(notificationRepository.findByTargetRoleOrderByCreatedAtDesc(Role.STAFF))
                .thenReturn(List.of(visible, hidden));

        List<NotificationResponse> result = notificationService.listVisibleForCurrentUser(false);

        assertEquals(1, result.size());
        assertEquals(NotificationEventType.PAYMENT_INCOMPLETE, result.get(0).getEventType());
    }

    @Test
    void notifyServiceRequestCreatedShouldRouteCleaningToHousekeeping() {
        Notification saved = baseNotification();
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Reservation reservation = new Reservation();
        reservation.setConfirmationNumber("RSV-123");

        HotelService service = new HotelService();
        service.setName("Deep Cleaning");
        service.setCategory(ServiceCategory.CLEANING);

        notificationService.notifyServiceRequestCreated(reservation, service, 1, new BigDecimal("50.00"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification created = captor.getValue();
        assertEquals(Role.STAFF, created.getTargetRole());
        assertEquals("HOUSEKEEPING", created.getTargetDepartment());
        assertEquals(NotificationEventType.SERVICE_REQUEST_CREATED, created.getEventType());
    }

    @Test
    void notifyServiceRequestCreatedShouldRouteFoodToAllStaff() {
        Notification saved = baseNotification();
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Reservation reservation = new Reservation();
        reservation.setConfirmationNumber("RSV-123");

        HotelService service = new HotelService();
        service.setName("Dinner");
        service.setCategory(ServiceCategory.FOOD);

        notificationService.notifyServiceRequestCreated(reservation, service, 1, new BigDecimal("80.00"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification created = captor.getValue();
        assertEquals(Role.STAFF, created.getTargetRole());
        assertNull(created.getTargetDepartment());
        assertEquals(NotificationEventType.SERVICE_REQUEST_CREATED, created.getEventType());
    }

    private void authenticateAs(String email, String authority) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of(() -> authority)));
    }

    private Notification baseNotification() {
        Notification notification = new Notification();
        notification.setEventType(NotificationEventType.PAYMENT_INCOMPLETE);
        notification.setTargetRole(Role.STAFF);
        notification.setTargetDepartment("FRONT_DESK");
        notification.setTitle("Payment incomplete");
        notification.setMessage("Reservation RSV-123 has an outstanding balance");
        notification.setReferenceType("RESERVATION");
        notification.setReferenceId("RSV-123");
        notification.setRead(false);
        try {
            java.lang.reflect.Field idField = Notification.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(notification, 10L);
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
        return notification;
    }
}
