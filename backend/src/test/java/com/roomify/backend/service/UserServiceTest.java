package com.roomify.backend.service;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@DisplayName("User Service Security & Lockout Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordValidatorService passwordValidatorService;
    @Mock
    private AuditService auditService;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should validate, encode, and log when creating a staff user")
    void shouldCompleteFullSecurityFlowOnCreate() {
        String email = "moaz@roomify.com";
        String plainPass = "Strong@Pass123";
        String hashedPass = "encrypted_version";

        when(passwordEncoder.encode(plainPass)).thenReturn(hashedPass);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.createStaffUser(email, plainPass, "Moaz", "IT");

        assertNotNull(result);
        assertEquals(hashedPass, result.getPasswordHash());
        verify(passwordValidatorService).validatePassword(plainPass);
        verify(auditService).log(eq("USER_CREATED"), eq(email), anyString());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should lock account after 5 failed attempts and log it")
    void shouldLockAccountAfterFiveAttempts() {
        User user = new User("moaz@roomify.com", "hash", Role.STAFF, true);
        user.setFailedAttempts(4); 

        userService.handleFailedLogin(user);

        assertEquals(5, user.getFailedAttempts());
        assertNotNull(user.getLockUntil());
        assertTrue(user.getLockUntil().isAfter(Instant.now()));
        
        verify(auditService).log(eq("LOGIN_FAILED_ATTEMPT"), anyString(), anyString());
        verify(auditService).log(eq("ACCOUNT_LOCKED"), anyString(), anyString());
    }

    @Test
    @DisplayName("Should reset attempts and lock status")
    void shouldResetLockoutStatus() {
        User user = new User("moaz@roomify.com", "hash", Role.STAFF, true);
        user.setFailedAttempts(3);
        user.setLockUntil(Instant.now().plusSeconds(1800));

        userService.resetFailedAttempts(user);

        assertEquals(0, user.getFailedAttempts());
        assertNull(user.getLockUntil());
        verify(auditService).log(eq("LOCKOUT_RESET"), anyString(), anyString());
    }
}