package com.roomify.backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.roomify.backend.config.JwtUtils;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class JwtUtilsTest {

    @Autowired
    private JwtUtils jwtUtils;

    @Test
    @DisplayName("Should generate a valid JWT and extract the correct email")
    void testGenerateAndExtract() {
        // Arrange
        String email = "student@uqu.edu.sa";
        String role = "MANAGER";

        // Act
        String token = jwtUtils.generateToken(email, role);
        String extractedEmail = jwtUtils.extractEmail(token);
        String extractedRole = jwtUtils.extractRole(token);

        // Assert
        assertNotNull(token, "Token should not be null");
        assertEquals(email, extractedEmail, "Extracted email should match input");
        assertEquals(role, extractedRole, "Extracted role should match input");
    }

    @Test
    @DisplayName("Should return true for a valid token and false for an invalid one")
    void testValidation() {
        // Arrange
        String token = jwtUtils.generateToken("wahib@uqu.edu.sa", "STAFF");
        String fakeToken = token + "modified"; // Tampering with the signature

        // Act & Assert
        assertTrue(jwtUtils.validateToken(token), "Valid token should pass validation");
        assertFalse(jwtUtils.validateToken(fakeToken), "Tampered token should fail validation");
    }
}