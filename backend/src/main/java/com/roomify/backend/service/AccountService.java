package com.roomify.backend.service;

import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public AccountService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public void softDeleteCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setActive(false);
        if (user.getStaff() != null) {
            user.getStaff().setActive(false);
        }

        auditService.log(
                email,
                "ACCOUNT_SELF_DEACTIVATED",
                "User:" + user.getId(),
                "{ \"active\": false }");
    }
}
