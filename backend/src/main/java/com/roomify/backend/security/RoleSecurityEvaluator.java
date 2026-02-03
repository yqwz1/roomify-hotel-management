package com.roomify.backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component("roleSecurityEvaluator")
public class RoleSecurityEvaluator {

    private static final Logger log = LoggerFactory.getLogger(RoleSecurityEvaluator.class);

    public boolean hasAnyRole(String[] roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Authorization failed: No authentication found");
            return false;
        }

        Set<String> userRoles = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        if (log.isDebugEnabled()) {
            log.debug("Required roles: {}", Arrays.toString(roles));
            log.debug("User roles: {}", userRoles);
        }

        boolean hasRole = Arrays.stream(roles)
                .anyMatch(role -> 
                    userRoles.contains("ROLE_" + role) || 
                    userRoles.contains(role)
                );

        if (hasRole) {
            log.debug("Authorization successful for user: {}", authentication.getName());
        } else {
            log.warn("Authorization failed for user: {}. Required: {}, Has: {}", 
                authentication.getName(), Arrays.toString(roles), userRoles);
        }

        return hasRole;
    }

    public boolean hasRole(String role) {
        return hasAnyRole(new String[]{role});
    }

    public boolean hasAllRoles(String[] roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Set<String> userRoles = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        return Arrays.stream(roles)
                .allMatch(role -> 
                    userRoles.contains("ROLE_" + role) || 
                    userRoles.contains(role)
                );
    }
}