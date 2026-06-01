package com.roomify.backend.exception;

import org.springframework.http.HttpStatus;

public class GeminiApiException extends RuntimeException {

    private final HttpStatus status;

    public GeminiApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
