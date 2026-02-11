package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class PasswordValidatorServiceTest {

    private final PasswordValidatorService validator = new PasswordValidatorService();

    @Test
    void shouldAcceptValidPassword() {
        // Test case for a password that meets all requirements
        assertDoesNotThrow(() -> validator.validatePassword("Strong@Pass123"));
    }

    @Test
    void shouldRejectShortPassword() {
        // Test case for a password shorter than 8 characters
        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
            validator.validatePassword("W@1pass")
        );
        // Verify that the error message contains the expected guidance
        assertTrue(exception.getMessage().contains("at least 8 characters"));
    }

    @Test
    void shouldRejectNoUpperCase() {
        // Test case for a password missing an uppercase letter
        assertThrows(IllegalArgumentException.class, () -> 
            validator.validatePassword("weak@pass123")
        );
    }

    @Test
    void shouldRejectNoSpecialChar() {
        // Test case for a password missing a special character
        assertThrows(IllegalArgumentException.class, () -> 
            validator.validatePassword("WeakPass123")
        );
    }

    @Test
    void shouldRejectNoNumber() {
        // Test case for a password missing a digit
        assertThrows(IllegalArgumentException.class, () -> 
            validator.validatePassword("Weak@Pass")
        );
    }
}