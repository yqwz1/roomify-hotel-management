package com.roomify.backend.controller;

import com.roomify.backend.dto.JwtResponse;
import com.roomify.backend.dto.LoginRequest;
import com.roomify.backend.service.AuditService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        @Autowired
        private com.roomify.backend.service.AuditService auditService;

        @Autowired
        private com.roomify.backend.config.JwtUtils jwtUtils;

        @PostMapping("/login")
        public ResponseEntity<?> login(
                        @Valid @RequestBody LoginRequest request,
                        HttpServletRequest httpRequest) {

                String ipAddress = httpRequest.getRemoteAddr();

                // Temporary mock authentication (password check only)
                // In real app, check DB.
                if ("admin@roomify.com".equals(request.getEmail())
                                && "password123".equals(request.getPassword())) {

                        // Generate REAL token
                        String token = jwtUtils.generateToken(request.getEmail(), "ROLE_MANAGER");

                        // Successful login audit
                        auditService.logLoginAttempt(
                                        request.getEmail(),
                                        ipAddress,
                                        true);

                        return ResponseEntity.ok(new JwtResponse(
                                        token,
                                        1L,
                                        "Admin",
                                        "admin@roomify.com",
                                        List.of("ROLE_MANAGER")));
                }
                // Failed login audit
                auditService.logLoginAttempt(
                                request.getEmail(),
                                ipAddress,
                                false);

                return ResponseEntity.badRequest().body("Error: Wrong email or password");
        }
}
