package com.roomify.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.entity.AuditLog;
import com.roomify.backend.repository.AuditLogRepository;

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
     * @param target   The affected resource
     * @param metadata Extra contextual data
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String target, String metadata) {

        try {

            String actor = getCurrentActor();

            AuditLog auditLog = new AuditLog(
                    actor,
                    action,
                    target,
                    metadata);

            auditLogRepository.save(auditLog);

        } catch (Exception ex) {

            // Audit logging must NEVER break the main flow
            System.err.println("Audit log failed: " + ex.getMessage());
        }
    }

    /**
     * Writes an audit log entry with explicit actor.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String actor, String action, String target, String metadata) {

        try {

            AuditLog auditLog = new AuditLog(
                    actor,
                    action,
                    target,
                    metadata);

            auditLogRepository.save(auditLog);

        } catch (Exception ex) {

            System.err.println("Audit log failed: " + ex.getMessage());
        }
    }

    /**
     * Gets the currently authenticated user.
     */
    private String getCurrentActor() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {

            return "SYSTEM";
        }

        return authentication.getName();
    }
}
