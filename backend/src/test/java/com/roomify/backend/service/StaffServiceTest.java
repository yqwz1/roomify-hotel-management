package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.roomify.backend.dto.StaffCreateRequest;
import com.roomify.backend.exception.EmailDeliveryException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.StaffRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

@DisplayName("StaffService Tests")
class StaffServiceTest {

    private StaffRepository staffRepository;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private PasswordGeneratorService passwordGeneratorService;
    private EmailService emailService;
    private StaffService staffService;

    @BeforeEach
    void setUp() {
        staffRepository = mock(StaffRepository.class);
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        passwordGeneratorService = mock(PasswordGeneratorService.class);
        emailService = mock(EmailService.class);
        staffService = new StaffService(
                staffRepository,
                userRepository,
                passwordEncoder,
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
    @DisplayName("Should prevent deactivating the current user's own account")
    void shouldPreventSelfDeactivate() {
        User user = new User("manager@roomify.com", "hash", Role.MANAGER, true);
        Staff staff = new Staff(user, "Manager", "Management");
        staff.setUser(user);
        user.setStaff(staff);

        when(staffRepository.findById(1L)).thenReturn(Optional.of(staff));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "manager@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        ResourceConflictException exception = assertThrows(
                ResourceConflictException.class,
                () -> staffService.setActive(1L, false)
        );

        assertTrue(exception.getMessage().toLowerCase().contains("deactivate"));
    }

    @Test
    @DisplayName("Should allow deactivating other staff members")
    void shouldDeactivateOtherStaff() {
        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        Staff staff = new Staff(user, "Staff", "Front Desk");
        staff.setUser(user);
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

    @Test
    @DisplayName("Should generate password and send email on staff creation")
    void shouldGeneratePasswordAndSendEmailOnCreate() {
        StaffCreateRequest request = new StaffCreateRequest("staff@roomify.com", "Staff", "Front Desk");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordGeneratorService.generatePassword()).thenReturn("Strong@Pass123");
        when(passwordEncoder.encode("Strong@Pass123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        staffService.createStaff(request);

        verify(emailService).sendStaffWelcomeEmail("staff@roomify.com", "Staff", "Strong@Pass123");
        verify(passwordEncoder).encode("Strong@Pass123");
    }

    @Test
    @DisplayName("Should fail staff creation when email delivery fails")
    void shouldFailCreateWhenEmailDeliveryFails() {
        StaffCreateRequest request = new StaffCreateRequest("staff@roomify.com", "Staff", "Front Desk");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordGeneratorService.generatePassword()).thenReturn("Strong@Pass123");
        when(passwordEncoder.encode("Strong@Pass123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new MailSendException("smtp down"))
                .when(emailService)
                .sendStaffWelcomeEmail(anyString(), anyString(), anyString());

        assertThrows(EmailDeliveryException.class, () -> staffService.createStaff(request));
    }
}
