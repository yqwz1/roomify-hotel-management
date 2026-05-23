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
        return createStaffUser(email, plainPassword, name, department, Role.STAFF);
    }

    public User createStaffUser(String email, String plainPassword, String name, String department, Role role) {
        passwordValidatorService.validatePassword(plainPassword);

        String passwordHash = passwordEncoder.encode(plainPassword);
        Role accountRole = resolveStaffAccountRole(role);

        User user = new User(email, passwordHash, accountRole, true);
        Staff staff = new Staff(user, name, department);
        user.setStaff(staff);

        User savedUser = userRepository.save(user);

        // (Audit Log)
        auditService.log(
                "SYSTEM",
                "USER_CREATED",
                "User:" + email,
                "{ \"role\": \"" + accountRole.name() + "\", \"name\": \"" + name + "\" }");

        return savedUser;
    }

    private Role resolveStaffAccountRole(Role role) {
        if (role == null) {
            return Role.STAFF;
        }
        if (role != Role.STAFF && role != Role.MANAGER) {
            throw new IllegalArgumentException("Role must be STAFF or MANAGER");
        }
        return role;
    }

    /**
     * Handle failed login attempt with lockout logic.
     */
    public void handleFailedLogin(User user) {
        int newAttempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(newAttempts);

        auditService.log(
                user.getEmail(),
                "LOGIN_FAILED_ATTEMPT",
                "User:" + user.getEmail(),
                "{ \"attempts\": " + newAttempts + " }");

        if (newAttempts >= 5) {
            user.setLockUntil(Instant.now().plusSeconds(1800)); // قفل 30 دقيقة
            auditService.log(
                    user.getEmail(),
                    "ACCOUNT_LOCKED",
                    "User:" + user.getEmail(),
                    "{ \"until\": \"" + user.getLockUntil() + "\" }");
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
            auditService.log(
                    user.getEmail(),
                    "LOCKOUT_RESET",
                    "User:" + user.getEmail(),
                    "{ \"status\": \"success\" }");
        }
    }

    /**
     * Manual unlock by manager.
     */
    public void manualUnlock(User user) {
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        userRepository.save(user);

        auditService.log(
                "MANAGER",
                "MANUAL_UNLOCK",
                "User:" + user.getEmail(),
                "{ \"status\": \"unlocked by manager\" }");
    }

    public boolean isAccountLocked(User user) {
        if (user.getLockUntil() == null)
            return false;
        return user.getLockUntil().isAfter(Instant.now());
    }
}
