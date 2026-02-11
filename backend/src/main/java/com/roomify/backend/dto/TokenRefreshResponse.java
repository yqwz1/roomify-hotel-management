package com.roomify.backend.dto;

public class TokenRefreshResponse {
    private String token;
    private String type = "Bearer";

    public TokenRefreshResponse() {
    }

    public TokenRefreshResponse(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
