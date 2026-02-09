package com.roomify.backend.controller;

import com.roomify.backend.dto.JwtResponse;
import com.roomify.backend.dto.LoginRequest;
import com.roomify.backend.service.AuditService;
import com.roomify.backend.config.JwtUtils;
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
        private AuditService auditService;

        @Autowired
        private JwtUtils jwtUtils;

        @PostMapping("/login")
        public ResponseEntity<?> login(
                        @Valid @RequestBody LoginRequest request,
                        HttpServletRequest httpRequest) {

                String ipAddress = httpRequest.getRemoteAddr();
                String target = request.getEmail(); // الحساب اللي حاول يسجل دخول

                // Mock authentication
                if ("admin@roomify.com".equals(request.getEmail())
                                && "password123".equals(request.getPassword())) {

                        String token = jwtUtils.generateToken(request.getEmail(), "ROLE_MANAGER");

                        // Success login audit
                        auditService.log(
                                        "LOGIN_SUCCESS",
                                        target,
                                        "{\"ip\":\"" + ipAddress + "\"}");

                        return ResponseEntity.ok(new JwtResponse(
                                        token,
                                        1L,
                                        "Admin",
                                        "admin@roomify.com",
                                        List.of("ROLE_MANAGER")));
                }

                // Failed login audit
                auditService.log(
                                "LOGIN_FAILURE",
                                target,
                                "{\"ip\":\"" + ipAddress + "\"}");

                return ResponseEntity.badRequest().body("Error: Wrong email or password");
        }
}
