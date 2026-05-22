package com.roomify.backend.notification;

import com.roomify.backend.notification.dto.PasswordResetConfirmRequest;
import com.roomify.backend.notification.dto.PasswordResetRequest;
import com.roomify.backend.service.PasswordValidatorService;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordValidatorService passwordValidatorService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationEmailService emailService;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordValidatorService passwordValidatorService,
            PasswordEncoder passwordEncoder,
            NotificationEmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordValidatorService = passwordValidatorService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void requestReset(PasswordResetRequest request, String localeTag) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Optional<User> userCandidate = userRepository.findByEmailIgnoreCase(email);
        if (userCandidate.isEmpty()) {
            log.info("Password reset requested for unknown email {}", email);
            return;
        }

        User user = userCandidate.get();
        if (tokenRepository.countByUserAndCreatedAtAfter(user, LocalDateTime.now().minusHours(1)) >= 3) {
            log.warn("Password reset rate limited for {}", email);
            return;
        }

        String rawToken = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        tokenRepository.save(token);

        emailService.sendPasswordResetEmail(email, resolveDisplayName(user), rawToken, localeTag);
    }

    public void confirmReset(PasswordResetConfirmRequest request) {
        passwordValidatorService.validatePassword(request.getNewPassword());

        PasswordResetToken token = tokenRepository.findByTokenHash(hash(request.getToken().trim().toUpperCase(Locale.ROOT)))
                .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

        if (token.getUsedAt() != null) {
            throw new IllegalArgumentException("Reset token has already been used");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        token.setUsedAt(LocalDateTime.now());
        userRepository.save(user);
        tokenRepository.save(token);
    }

    private String resolveDisplayName(User user) {
        if (user.getStaff() != null && user.getStaff().getName() != null && !user.getStaff().getName().isBlank()) {
            return user.getStaff().getName();
        }
        return user.getEmail();
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
