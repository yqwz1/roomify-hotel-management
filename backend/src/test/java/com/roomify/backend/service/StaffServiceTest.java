package com.roomify.backend.service;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.roomify.backend.dto.StaffCreateRequest;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.dto.StaffResponse;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.StaffRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@DisplayName("StaffService Tests")
class StaffServiceTest {

    private StaffRepository staffRepository;
    private UserRepository userRepository;
    private UserService userService; // أضفنا هذا
    private PasswordGeneratorService passwordGeneratorService;
    private EmailService emailService;
    private AuditService auditService;
    private StaffService staffService;

    @BeforeEach
    void setUp() {
        staffRepository = mock(StaffRepository.class);
        userRepository = mock(UserRepository.class);
        userService = mock(UserService.class); // عمل Mock للخدمة الجديدة
        passwordGeneratorService = mock(PasswordGeneratorService.class);
        emailService = mock(EmailService.class);
        auditService = mock(AuditService.class);

        staffService = new StaffService(
                staffRepository,
                userRepository,
                userService,
                passwordGeneratorService,
                emailService,
                auditService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should generate password and call UserService on staff creation")
    void shouldCallUserServiceOnCreate() {
        // Arrange
        StaffCreateRequest request = new StaffCreateRequest("staff@roomify.com", "Staff", "Front Desk");
        User dummyUser = new User("staff@roomify.com", "hashed", Role.STAFF, true);
        dummyUser.setStaff(new Staff(dummyUser, "Staff", "Front Desk"));

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordGeneratorService.generatePassword()).thenReturn("Strong@Pass123");
        when(userService.createStaffUser(anyString(), anyString(), anyString(), anyString(), any(Role.class)))
                .thenReturn(dummyUser);

        // Act
        staffService.createStaff(request);

        // Assert
        verify(passwordGeneratorService).generatePassword();
        verify(userService).createStaffUser(
                eq("staff@roomify.com"),
                eq("Strong@Pass123"),
                anyString(),
                anyString(),
                eq(Role.STAFF));
        verify(emailService).sendStaffWelcomeEmail(eq("staff@roomify.com"), anyString(), eq("Strong@Pass123"));
    }

    @Test
    @DisplayName("Should pass requested manager role when creating a manager account")
    void shouldPassRequestedManagerRoleOnCreate() {
        StaffCreateRequest request =
                new StaffCreateRequest("manager.new@roomify.com", "Manager", "Management", "MANAGER");
        User dummyUser = new User("manager.new@roomify.com", "hashed", Role.MANAGER, true);
        dummyUser.setStaff(new Staff(dummyUser, "Manager", "Management"));

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordGeneratorService.generatePassword()).thenReturn("Strong@Pass123");
        when(userService.createStaffUser(anyString(), anyString(), anyString(), anyString(), any(Role.class)))
                .thenReturn(dummyUser);

        staffService.createStaff(request);

        verify(userService).createStaffUser(
                eq("manager.new@roomify.com"),
                eq("Strong@Pass123"),
                anyString(),
                anyString(),
                eq(Role.MANAGER));
        verify(emailService).sendStaffWelcomeEmail(eq("manager.new@roomify.com"), anyString(), eq("Strong@Pass123"));
    }

    @Test
    @DisplayName("Should prevent deactivating the current user's own account")
    void shouldPreventSelfDeactivate() {
        User user = new User("manager@roomify.com", "hash", Role.MANAGER, true);
        Staff staff = new Staff(user, "Manager", "Management");
        user.setStaff(staff);

        when(staffRepository.findById(1L)).thenReturn(Optional.of(staff));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "manager@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))));

        assertThrows(ResourceConflictException.class, () -> staffService.setActive(1L, false));
    }

    @Test
    @DisplayName("Should allow deactivating other staff members")
    void shouldDeactivateOtherStaff() {
        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff", "Front Desk");
        user.setStaff(staff);

        when(staffRepository.findById(2L)).thenReturn(Optional.of(staff));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "manager@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))));

        staffService.setActive(2L, false);

        assertFalse(staff.isActive());
        assertFalse(user.isActive());
    }

    @Test
    @DisplayName("Should prevent deleting the current user's own account")
    void shouldPreventSelfDelete() {
        User user = new User("manager@roomify.com", "hash", Role.MANAGER, true);
        Staff staff = new Staff(user, "Manager", "Management");
        user.setStaff(staff);

        when(staffRepository.findById(1L)).thenReturn(Optional.of(staff));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "manager@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        assertThrows(ResourceConflictException.class, () -> staffService.softDeleteStaff(1L));
    }

    @Test
    @DisplayName("Should soft-delete another staff member by disabling their account")
    void shouldSoftDeleteOtherStaff() {
        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff", "Front Desk");
        user.setStaff(staff);

        when(staffRepository.findById(2L)).thenReturn(Optional.of(staff));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        staffService.softDeleteStaff(2L);

        assertFalse(staff.isActive());
        assertFalse(user.isActive());
        verify(auditService).log(anyString(), eq("STAFF_DELETED"), anyString(), anyString());
    }

    @Test
    @DisplayName("Should return staff without requiring a search keyword")
    void shouldReturnStaffWithoutSearchKeyword() {
        User aliceUser = new User("alice@roomify.com", "hash", Role.STAFF, true);
        Staff alice = new Staff(aliceUser, "Alice", "Front Desk");
        aliceUser.setStaff(alice);

        User bobUser = new User("bob@roomify.com", "hash", Role.MANAGER, true);
        Staff bob = new Staff(bobUser, "Bob", "Management");
        bobUser.setStaff(bob);

        when(staffRepository.findAll()).thenReturn(List.of(alice, bob));

        List<StaffResponse> responses = staffService.searchStaff(null, Role.STAFF, null, true);

        assertEquals(1, responses.size());
        assertEquals("alice@roomify.com", responses.getFirst().getEmail());
    }
}
