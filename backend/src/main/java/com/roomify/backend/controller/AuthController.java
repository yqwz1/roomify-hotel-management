package com.roomify.backend.controller;

import com.roomify.backend.dto.JwtResponse;
import com.roomify.backend.dto.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*") // Allow React to connect
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        // Temporary check for testing until real authentication is implemented
        if ("admin@roomify.com".equals(request.getEmail()) && "password123".equals(request.getPassword())) {
            
            // Return success with dummy data
            return ResponseEntity.ok(new JwtResponse(
                "fake-jwt-token",
                1L,
                "Admin",
                "admin@roomify.com",
                List.of("ROLE_MANAGER")
            ));
        }

        
        return ResponseEntity.badRequest().body("Error: Wrong email or password");
    }
}