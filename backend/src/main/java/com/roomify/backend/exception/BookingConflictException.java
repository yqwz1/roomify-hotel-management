package com.roomify.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// must be 409 
@ResponseStatus(HttpStatus.CONFLICT)
public class BookingConflictException extends RuntimeException {
    public BookingConflictException(String message) {
        super(message);
    }
}