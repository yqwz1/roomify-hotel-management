package com.roomify.backend.controller;

import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.dto.ApiError;
import com.roomify.backend.dto.JwtResponse;
import com.roomify.backend.dto.LoginRequest;
import com.roomify.backend.dto.TokenRefreshRequest;
import com.roomify.backend.dto.TokenRefreshResponse;
import com.roomify.backend.service.AuditService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
                String target = request.getEmail(); // account attempted to log in

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

                ApiError error = new ApiError(
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                "Wrong email or password",
                                httpRequest.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        @PostMapping("/refresh")
        public ResponseEntity<?> refresh(
                        @Valid @RequestBody TokenRefreshRequest request,
                        HttpServletRequest httpRequest) {
                String token = request.getToken();
                try {
                        Claims claims = jwtUtils.parseClaims(token);
                        String email = claims.getSubject();
                        String role = claims.get("role", String.class);

                        if (email == null || email.isBlank()) {
                                ApiError error = new ApiError(
                                                HttpStatus.UNAUTHORIZED.value(),
                                                "Unauthorized",
                                                "Invalid token subject",
                                                httpRequest.getRequestURI()
                                );
                                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                        }

                        if (role == null || role.isBlank()) {
                                ApiError error = new ApiError(
                                                HttpStatus.UNAUTHORIZED.value(),
                                                "Unauthorized",
                                                "Invalid token role",
                                                httpRequest.getRequestURI()
                                );
                                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                        }

                        String newToken = jwtUtils.generateToken(email, role);
                        return ResponseEntity.ok(new TokenRefreshResponse(newToken));
                } catch (ExpiredJwtException e) {
                        ApiError error = new ApiError(
                                        HttpStatus.UNAUTHORIZED.value(),
                                        "Unauthorized",
                                        "Token expired",
                                        httpRequest.getRequestURI()
                        );
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                } catch (JwtException | IllegalArgumentException e) {
                        ApiError error = new ApiError(
                                        HttpStatus.UNAUTHORIZED.value(),
                                        "Unauthorized",
                                        "Invalid token",
                                        httpRequest.getRequestURI()
                        );
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                }
        }
}
