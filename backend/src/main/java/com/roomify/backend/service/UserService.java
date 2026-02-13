package com.roomify.backend.service;

import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordValidatorService passwordValidatorService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordValidatorService passwordValidatorService,
                       AuditService auditService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordValidatorService = passwordValidatorService;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates a staff user with password validation, encoding, and audit logging.
     */
    public User createStaffUser(String email, String plainPassword, String name, String department) {
        passwordValidatorService.validatePassword(plainPassword);

        String passwordHash = passwordEncoder.encode(plainPassword);

        User user = new User(email, passwordHash, Role.STAFF, true);
        Staff staff = new Staff(user, name, department);
        user.setStaff(staff);

        User savedUser = userRepository.save(user);

        // (Audit Log)
        auditService.log("USER_CREATED", email, "{ \"role\": \"STAFF\", \"name\": \"" + name + "\" }");

        return savedUser;
    }

    /**
     * Handle failed login attempt with lockout logic.
     */
    public void handleFailedLogin(User user) {
        int newAttempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(newAttempts);

        auditService.log("LOGIN_FAILED_ATTEMPT", user.getEmail(), "{ \"attempts\": " + newAttempts + " }");

        if (newAttempts >= 5) {
            user.setLockUntil(Instant.now().plusSeconds(1800)); // قفل 30 دقيقة
            auditService.log("ACCOUNT_LOCKED", user.getEmail(), "{ \"until\": \"" + user.getLockUntil() + "\" }");
        }
        userRepository.save(user);
    }

    /**
     * Resets attempts upon successful login.
     */
    public void resetFailedAttempts(User user) {
        if (user.getFailedAttempts() > 0 || user.getLockUntil() != null) {
            user.setFailedAttempts(0);
            user.setLockUntil(null);
            userRepository.save(user);
            auditService.log("LOCKOUT_RESET", user.getEmail(), "{ \"status\": \"success\" }");
        }
    }

    public boolean isAccountLocked(User user) {
        if (user.getLockUntil() == null) return false;
        return user.getLockUntil().isAfter(Instant.now());
    }
}