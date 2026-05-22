package com.roomify.backend.dto;

import java.util.List;

public class RegisterResponse {

    private Long id;
    private Long guestId;
    private String name;
    private String email;
    private List<String> roles;

    public RegisterResponse(Long id, Long guestId, String name, String email, List<String> roles) {
        this.id = id;
        this.guestId = guestId;
        this.name = name;
        this.email = email;
        this.roles = roles;
    }

    public Long getId() {
        return id;
    }

    public Long getGuestId() {
        return guestId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public List<String> getRoles() {
        return roles;
    }
}
