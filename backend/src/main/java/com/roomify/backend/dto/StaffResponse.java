package com.roomify.backend.dto;

import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import java.time.Instant;

public class StaffResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String department;
    private final boolean active;
    private final boolean locked;
    private final int failedAttempts;
    private final Instant lockUntil;

    public StaffResponse(
            Long id,
            String email,
            String name,
            String department,
            boolean active,
            boolean locked,
            int failedAttempts,
            Instant lockUntil) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.department = department;
        this.active = active;
        this.locked = locked;
        this.failedAttempts = failedAttempts;
        this.lockUntil = lockUntil;
    }

    public static StaffResponse from(Staff staff) {
        User user = staff.getUser();
        Instant lockUntil = user != null ? user.getLockUntil() : null;
        String email = user != null ? user.getEmail() : null;
        boolean userActive = user == null || user.isActive();

        return new StaffResponse(
                staff.getId(),
                email,
                staff.getName(),
                staff.getDepartment(),
                staff.isActive() && userActive,
                lockUntil != null && lockUntil.isAfter(Instant.now()),
                user != null ? user.getFailedAttempts() : 0,
                lockUntil
        );
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getDepartment() {
        return department;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isLocked() {
        return locked;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public Instant getLockUntil() {
        return lockUntil;
    }
}
