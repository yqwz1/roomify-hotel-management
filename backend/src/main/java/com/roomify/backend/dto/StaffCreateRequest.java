package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.user.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class StaffCreateRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Department is required")
    @Size(max = 50, message = "Department must be at most 50 characters")
    private String department;

    private String role;

    public StaffCreateRequest() {
    }

    public StaffCreateRequest(String email, String name, String department) {
        this.email = email;
        this.name = name;
        this.department = department;
    }

    public StaffCreateRequest(String email, String name, String department, String role) {
        this(email, name, department);
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Role getResolvedRole() {
        if (role == null || role.isBlank()) {
            return Role.STAFF;
        }
        return Role.valueOf(role.trim().toUpperCase());
    }

    @AssertTrue(message = "Role must be STAFF or MANAGER")
    public boolean isRoleAllowed() {
        if (role == null || role.isBlank()) {
            return true;
        }
        try {
            Role requestedRole = Role.valueOf(role.trim().toUpperCase());
            return requestedRole == Role.STAFF || requestedRole == Role.MANAGER;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
