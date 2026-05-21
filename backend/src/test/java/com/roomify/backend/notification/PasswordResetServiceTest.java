package com.roomify.backend.notification;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.roomify.backend.notification.dto.PasswordResetConfirmRequest;
import com.roomify.backend.notification.dto.PasswordResetRequest;
import com.roomify.backend.service.PasswordValidatorService;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class PasswordResetServiceTest {

    private UserRepository userRepository;
    private PasswordResetTokenRepository tokenRepository;
    private PasswordValidatorService passwordValidatorService;
    private PasswordEncoder passwordEncoder;
    private NotificationEmailService emailService;
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        tokenRepository = mock(PasswordResetTokenRepository.class);
        passwordValidatorService = mock(PasswordValidatorService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        emailService = mock(NotificationEmailService.class);
        passwordResetService = new PasswordResetService(
                userRepository,
                tokenRepository,
                passwordValidatorService,
                passwordEncoder,
                emailService);
    }

    @Test
    void requestResetQueuesEmailForKnownUser() {
        User user = new User("staff@roomify.com", "hash", Role.STAFF, true);
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("staff@roomify.com");

        when(userRepository.findByEmailIgnoreCase("staff@roomify.com")).thenReturn(Optional.of(user));
        when(tokenRepository.countByUserAndCreatedAtAfter(eq(user), any(LocalDateTime.class))).thenReturn(0L);
        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        passwordResetService.requestReset(request, "en");

        verify(emailService).sendPasswordResetEmail(eq("staff@roomify.com"), eq("staff@roomify.com"), any(String.class), eq("en"));
    }

    @Test
    void confirmResetRejectsExpiredToken() {
        PasswordResetConfirmRequest request = new PasswordResetConfirmRequest();
        request.setToken("AB12CD34");
        request.setNewPassword("Str0ngPassword!");

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(new User("staff@roomify.com", "hash", Role.STAFF, true));
        token.setTokenHash("hash");
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(tokenRepository.findByTokenHash(any(String.class))).thenReturn(Optional.of(token));

        assertThrows(IllegalArgumentException.class, () -> passwordResetService.confirmReset(request));
    }
}
