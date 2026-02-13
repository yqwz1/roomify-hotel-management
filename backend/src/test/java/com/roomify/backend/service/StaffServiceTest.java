package com.roomify.backend.service;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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
    private StaffService staffService;

    @BeforeEach
    void setUp() {
        staffRepository = mock(StaffRepository.class);
        userRepository = mock(UserRepository.class);
        userService = mock(UserService.class); // عمل Mock للخدمة الجديدة
        passwordGeneratorService = mock(PasswordGeneratorService.class);
        emailService = mock(EmailService.class);
        
        staffService = new StaffService(
                staffRepository,
                userRepository,
                userService,
                passwordGeneratorService,
                emailService
        );
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
        when(userService.createStaffUser(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(dummyUser);

        // Act
        staffService.createStaff(request);

        // Assert
        verify(passwordGeneratorService).generatePassword();
        verify(userService).createStaffUser(eq("staff@roomify.com"), eq("Strong@Pass123"), anyString(), anyString());
        verify(emailService).sendStaffWelcomeEmail(eq("staff@roomify.com"), anyString(), eq("Strong@Pass123"));
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
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

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
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        staffService.setActive(2L, false);

        assertFalse(staff.isActive());
        assertFalse(user.isActive());
    }
}