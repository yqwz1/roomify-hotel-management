package com.roomify.backend.service;

import com.roomify.backend.entity.AuditLog;
import com.roomify.backend.repository.AuditLogRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Central service used across the system to write audit log entries.
 * Any controller or service can call this to record user activity.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Writes an audit log entry using the currently authenticated user.
     *
     * @param action   The action performed (e.g., CREATE_ROOM)
     * @param target   The affected resource (e.g., Room#12)
     * @param metadata Additional details (optional, can be JSON text)
     */
    public void log(String action, String target, String metadata) {
        String actor = getCurrentActor();
        AuditLog log = new AuditLog(actor, action, target, metadata);
        auditLogRepository.save(log);
    }

    /**
     * Extracts the email/username of the currently logged-in user
     * from Spring Security context.
     */
    private String getCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return "SYSTEM"; // fallback for internal/background actions
        }

        return authentication.getName();
    }
}
