package com.roomify.backend.assistant.service;

import com.roomify.backend.config.JwtUtils;
import io.jsonwebtoken.Claims;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuestAssistantStompAuthenticationService {

    private final JwtUtils jwtUtils;

    public AuthenticatedWebSocketUser authenticateBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing Bearer token for websocket connection");
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw new IllegalArgumentException("Missing Bearer token for websocket connection");
        }

        Claims claims = jwtUtils.parseClaims(token);
        String email = claims.getSubject();
        List<String> roles = jwtUtils.extractRoles(claims);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                email,
                null,
                roles.stream().map(SimpleGrantedAuthority::new).toList());

        return new AuthenticatedWebSocketUser(email, roles, authentication);
    }

    public record AuthenticatedWebSocketUser(
            String email,
            List<String> roles,
            UsernamePasswordAuthenticationToken authentication) {
    }
}
