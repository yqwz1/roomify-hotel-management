package com.roomify.backend.service;

import java.time.Instant;

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

    public UserService(UserRepository userRepository,
            PasswordValidatorService passwordValidatorService,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordValidatorService = passwordValidatorService;
        this.auditService = auditService;
    }

    /**
     * Creates a staff user after validating password strength.
     */
    public User createStaffUser(String email, String plainPassword, String name, String department) {
        // Apply password policy (Task 110)
        passwordValidatorService.validatePassword(plainPassword);

        User user = new User(email, plainPassword, Role.STAFF, true);
        Staff staff = new Staff(user, name, department);

        staff.setUser(user);
        user.setStaff(staff);

        return userRepository.save(user);
    }

    /**
     * Increments failed attempts and locks account for 30 minutes if limit (5) is
     * reached.
     */
    public void handleFailedLogin(User user) {
        int newAttempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(newAttempts);

        // ✅ Log every failed attempt
        auditService.log(
                "LOGIN_FAILED_ATTEMPT",
                user.getEmail(),
                "{ \"failedAttempts\": " + newAttempts + " }");

        if (newAttempts >= 5) {
            user.setLockUntil(Instant.now().plusSeconds(1800));

            // ✅ Log lockout event (system actor)
            auditService.log(
                    "ACCOUNT_LOCKED",
                    user.getEmail(),
                    "{ \"failedAttempts\": " + newAttempts +
                            ", \"lockUntil\": \"" + user.getLockUntil() + "\" }");
        }

        userRepository.save(user);
    }

    /**
     * Resets failed login attempts and clears lock status.
     */
    public void resetFailedAttempts(User user) {
        if (user.getFailedAttempts() > 0 || user.getLockUntil() != null) {
            user.setFailedAttempts(0);
            user.setLockUntil(null);
            userRepository.save(user);
        }
    }

    /**
     * Checks if the account is currently under a lockout period.
     */
    public boolean isAccountLocked(User user) {
        if (user.getLockUntil() == null) {
            return false;
        }
        return user.getLockUntil().isAfter(Instant.now());
    }
}
