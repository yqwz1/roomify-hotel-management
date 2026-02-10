package com.roomify.backend.dto;

import com.roomify.backend.user.Staff;

public class StaffResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String department;
    private final boolean active;

    public StaffResponse(Long id, String email, String name, String department, boolean active) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.department = department;
        this.active = active;
    }

    public static StaffResponse from(Staff staff) {
        String email = staff.getUser() != null ? staff.getUser().getEmail() : null;
        return new StaffResponse(
                staff.getId(),
                email,
                staff.getName(),
                staff.getDepartment(),
                staff.isActive()
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
}
