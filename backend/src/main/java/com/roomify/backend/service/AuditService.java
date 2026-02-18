package com.roomify.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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
    public void log(String action, String target, String metadata) {
        String actor = getCurrentActor();
        AuditLog auditLog = new AuditLog(actor, action, target, metadata);
        auditLogRepository.save(auditLog);
    }

    /**
     * Writes an audit log entry with explicit actor.
     */
    public void log(String actor, String action, String target, String metadata) {
        AuditLog auditLog = new AuditLog(actor, action, target, metadata);
        auditLogRepository.save(auditLog);
    }

    private String getCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SYSTEM";
        }
        return authentication.getName();
    }
}