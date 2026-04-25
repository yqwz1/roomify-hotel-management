package com.roomify.backend.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

@Component
public class JwtUtils {

   @Value("${roomify.jwt.secret}")
    private String secretKey;

    @Value("${roomify.jwt.expiration}")
    private long jwtExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    // Implement generateToken(User user)
    public String generateToken(String email, String role) {
        return generateToken(email, role == null ? List.of() : List.of(role));
    }

    public String generateToken(String email, Collection<String> roles) {
        List<String> normalizedRoles = normalizeRoles(roles);
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", normalizedRoles);
        claims.put("role", normalizedRoles.isEmpty() ? null : normalizedRoles.get(0));

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Implement validateToken(String token)
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Log the error: "Invalid JWT signature" or "Expired token"
            return false;
        }
    }

    // Implement extractEmail(String token)
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("role", String.class);
    }

    public List<String> extractRoles(Claims claims) {
        Object rolesClaim = claims.get("roles");
        if (rolesClaim instanceof Collection<?> values) {
            return normalizeRoles(values.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .toList());
        }

        String role = claims.get("role", String.class);
        return normalizeRoles(role == null ? List.of() : List.of(role));
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private List<String> normalizeRoles(Collection<?> roles) {
        if (roles == null) {
            return List.of();
        }

        return roles.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .filter(role -> role != null && !role.isBlank())
                .distinct()
                .toList();
    }
}
