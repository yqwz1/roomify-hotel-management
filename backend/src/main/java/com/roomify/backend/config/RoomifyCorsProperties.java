package com.roomify.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RoomifyCorsProperties {

    private static final List<String> DEFAULT_ALLOWED_ORIGIN_PATTERNS = List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
            "http://localhost:3003",
            "http://127.0.0.1:3003",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://localhost:5173",
            "http://127.0.0.1:5173");

    private final List<String> allowedOriginPatterns;

    public RoomifyCorsProperties(
            @Value("${roomify.cors.allowed-origin-patterns:}") List<String> allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns.stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    public List<String> getAllowedOriginPatterns() {
        return allowedOriginPatterns.isEmpty() ? DEFAULT_ALLOWED_ORIGIN_PATTERNS : allowedOriginPatterns;
    }
}
