package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        String code,
        Map<String, String> validationErrors,
        Map<String, Object> details) {

    public ApiError(int status, String error, String message, String path) {
        this(Instant.now(), status, error, message, path, null, null, null);
    }

    public ApiError(int status, String error, String message, String path, Map<String, String> validationErrors) {
        this(Instant.now(), status, error, message, path, null, validationErrors, null);
    }

    public ApiError(
            int status,
            String error,
            String message,
            String path,
            String code,
            Map<String, Object> details) {
        this(Instant.now(), status, error, message, path, code, null, details);
    }
}
