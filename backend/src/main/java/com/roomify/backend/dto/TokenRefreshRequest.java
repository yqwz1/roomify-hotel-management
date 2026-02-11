package com.roomify.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class TokenRefreshRequest {
    @NotBlank(message = "Token is required")
    private String token;

    public TokenRefreshRequest() {
    }

    public TokenRefreshRequest(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
