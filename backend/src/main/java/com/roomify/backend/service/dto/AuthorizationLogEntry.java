package com.roomify.backend.service.dto;

import java.time.LocalDateTime;

public class AuthorizationLogEntry {

    private Long userId;
    private String email;
    private String method;
    private String resource;
    private boolean authorized;
    private String reason;
    private String department;
    private LocalDateTime timestamp;

    public AuthorizationLogEntry(
            Long userId,
            String email,
            String method,
            String resource,
            boolean authorized,
            String reason,
            String department
    ) {
        this.userId = userId;
        this.email = email;
        this.method = method;
        this.resource = resource;
        this.authorized = authorized;
        this.reason = reason;
        this.department = department;
        this.timestamp = LocalDateTime.now();
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getMethod() {
        return method;
    }

    public String getResource() {
        return resource;
    }

    public boolean isAuthorized() {
        return authorized;
    }

    public String getReason() {
        return reason;
    }

    public String getDepartment() {
        return department;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
