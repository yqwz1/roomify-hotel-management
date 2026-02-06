package com.roomify.backend.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("RoleSecurityEvaluator Tests")
class RoleSecurityEvaluatorTest {

    private RoleSecurityEvaluator evaluator;

    @BeforeEach
    void setUp() {
        evaluator = new RoleSecurityEvaluator();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should allow access when user has the required role")
    void shouldAllowWhenUserHasRequiredRole() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN"});

        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny access when user lacks the required role")
    void shouldDenyWhenUserLacksRequiredRole() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN"});

        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow when user has one of multiple required roles")
    void shouldAllowWhenUserHasOneOfMultipleRoles() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "manager@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN", "MANAGER"});

        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow when user has multiple roles and one matches")
    void shouldAllowWhenUserHasMultipleRolesAndOneMatches() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(
                                new SimpleGrantedAuthority("ROLE_USER"),
                                new SimpleGrantedAuthority("ROLE_MANAGER")
                        )
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN", "MANAGER"});

        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny when user has no matching roles")
    void shouldDenyWhenUserHasNoMatchingRoles() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(
                                new SimpleGrantedAuthority("ROLE_USER"),
                                new SimpleGrantedAuthority("ROLE_GUEST")
                        )
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN", "MANAGER"});

        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny when no authentication present")
    void shouldDenyWhenNoAuthentication() {
        SecurityContextHolder.clearContext();

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN"});

        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny when authentication is null")
    void shouldDenyWhenAuthenticationIsNull() {
        SecurityContextHolder.getContext().setAuthentication(null);

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN"});

        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny when user has no roles")
    void shouldDenyWhenUserHasNoRoles() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of()
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN"});

        assertFalse(result);
    }

    @Test
    @DisplayName("Should work with roles without ROLE_ prefix")
    void shouldWorkWithRolesWithoutPrefix() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ADMIN"))
                )
        );

        boolean result = evaluator.hasAnyRole(new String[]{"ADMIN"});

        assertTrue(result);
    }

    @Test
    @DisplayName("Should work with mixed prefix roles")
    void shouldWorkWithMixedPrefixRoles() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(
                                new SimpleGrantedAuthority("ROLE_ADMIN"),
                                new SimpleGrantedAuthority("MANAGER")
                        )
                )
        );

        boolean result1 = evaluator.hasAnyRole(new String[]{"ADMIN"});
        boolean result2 = evaluator.hasAnyRole(new String[]{"MANAGER"});

        assertTrue(result1);
        assertTrue(result2);
    }

    @Test
    @DisplayName("hasRole() should check single role")
    void hasRoleShouldCheckSingleRole() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        boolean result = evaluator.hasRole("ADMIN");

        assertTrue(result);
    }

    @Test
    @DisplayName("hasRole() should return false for missing role")
    void hasRoleShouldReturnFalseForMissingRole() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        boolean result = evaluator.hasRole("ADMIN");

        assertFalse(result);
    }

    @Test
    @DisplayName("hasAllRoles() should require all specified roles")
    void hasAllRolesShouldRequireAllRoles() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "superadmin@test.com",
                        null,
                        List.of(
                                new SimpleGrantedAuthority("ROLE_ADMIN"),
                                new SimpleGrantedAuthority("ROLE_MANAGER")
                        )
                )
        );

        boolean result = evaluator.hasAllRoles(new String[]{"ADMIN", "MANAGER"});

        assertTrue(result);
    }

    @Test
    @DisplayName("hasAllRoles() should deny when user lacks one role")
    void hasAllRolesShouldDenyWhenUserLacksOneRole() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        boolean result = evaluator.hasAllRoles(new String[]{"ADMIN", "MANAGER"});

        assertFalse(result);
    }

    @Test
    @DisplayName("hasAllRoles() should deny when no authentication")
    void hasAllRolesShouldDenyWhenNoAuthentication() {
        SecurityContextHolder.clearContext();

        boolean result = evaluator.hasAllRoles(new String[]{"ADMIN"});

        assertFalse(result);
    }

    @Test
    @DisplayName("Should handle real-world scenario: Admin accessing admin endpoint")
    void shouldHandleRealWorldAdminScenario() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        boolean canDeleteUsers = evaluator.hasAnyRole(new String[]{"ADMIN"});
        boolean canManageRoles = evaluator.hasAnyRole(new String[]{"ADMIN", "SUPER_ADMIN"});
        boolean canViewReports = evaluator.hasAnyRole(new String[]{"ADMIN", "MANAGER"});

        assertTrue(canDeleteUsers);
        assertTrue(canManageRoles);
        assertTrue(canViewReports);
    }

    @Test
    @DisplayName("Should handle real-world scenario: Manager accessing mixed endpoints")
    void shouldHandleRealWorldManagerScenario() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "manager@roomify.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        boolean canDeleteUsers = evaluator.hasAnyRole(new String[]{"ADMIN"});
        boolean canViewReports = evaluator.hasAnyRole(new String[]{"ADMIN", "MANAGER"});
        boolean canManageBookings = evaluator.hasAnyRole(new String[]{"MANAGER", "RECEPTIONIST"});

        assertFalse(canDeleteUsers);
        assertTrue(canViewReports);
        assertTrue(canManageBookings);
    }
}
