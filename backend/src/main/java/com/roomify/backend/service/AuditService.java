package com.roomify.backend.service;

import com.roomify.backend.entity.AuditLog;
import com.roomify.backend.repository.AuditLogRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void logLoginAttempt(String email, String ip, boolean success) {

        String status = success ? "SUCCESS" : "FAILURE";

        AuditLog log = new AuditLog(
                email,
                "LOGIN_ATTEMPT",
                status,
                ip
        );

        auditLogRepository.save(log);

        System.out.println(
                "Audit Log saved | Email: " + email +
                " | Status: " + status +
                " | IP: " + ip
        );
    }
}
