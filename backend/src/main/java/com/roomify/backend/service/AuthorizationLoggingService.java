package com.roomify.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.entity.AuditLog;
import com.roomify.backend.repository.AuditLogRepository;
import com.roomify.backend.service.dto.AuthorizationLogEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationLoggingService {

    private static final Logger logger = LoggerFactory.getLogger(AuthorizationLoggingService.class);

    private final ObjectMapper objectMapper;
    private final AuditLogRepository auditLogRepository;

    public AuthorizationLoggingService(
            ObjectMapper objectMapper,
            AuditLogRepository auditLogRepository
    ) {
        this.objectMapper = objectMapper;
        this.auditLogRepository = auditLogRepository;
    }

    public void logAuthorizationDecision(AuthorizationLogEntry entry) {

        try {
            String jsonLog = objectMapper.writeValueAsString(entry);

            if (entry.isAuthorized()) {
                logger.info(jsonLog);
            } else {
                logger.warn(jsonLog);
            }

            // Persist to DB (Audit Log)
            auditLogRepository.save(
                    new AuditLog(
                            entry.getEmail(),
                            entry.getResource() + "." + entry.getMethod(),
                            entry.isAuthorized() ? "AUTHORIZED" : "DENIED",
                            "N/A"
                    )
            );

        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize authorization log entry", e);
        }
    }
}
