package com.roomify.backend.security;

import com.roomify.backend.entity.Department;
import com.roomify.backend.entity.Role;
import com.roomify.backend.entity.User;
import com.roomify.backend.repository.UserRepository;
import com.roomify.backend.service.AuthorizationLoggingService;
import com.roomify.backend.service.dto.AuthorizationLogEntry;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityAspectTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthorizationLoggingService loggingService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private JoinPoint joinPoint;

    @Mock
    private MethodSignature signature;

    @InjectMocks
    private SecurityAspect securityAspect;

    private User user;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
        user = new User("test@example.com", "hash", Role.MANAGER, true);
        user.setDepartment(Department.IT);
    }

    @Test
    void shouldAllowAccess_WhenRoleMatches() throws NoSuchMethodException {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        Method method = TestService.class.getMethod("managerOnlyMethod");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getMethod()).thenReturn(method);
        when(joinPoint.getTarget()).thenReturn(new TestService());

        // Act
        assertDoesNotThrow(() -> securityAspect.checkAuthorization(joinPoint));

        // Assert
        verify(loggingService).logAuthorizationDecision(
                argThat(entry -> entry.isAuthorized() && entry.getUserId().equals(user.getEmail())));
    }

    @Test
    void shouldDenyAccess_WhenRoleMismatch() throws NoSuchMethodException {
        // Arrange
        user.setRole(Role.STAFF); // User is STAFF, but method requires MANAGER

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        Method method = TestService.class.getMethod("managerOnlyMethod");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getMethod()).thenReturn(method);
        when(joinPoint.getTarget()).thenReturn(new TestService());

        // Act & Assert
        AccessDeniedException exception = assertThrows(AccessDeniedException.class,
                () -> securityAspect.checkAuthorization(joinPoint));

        verify(loggingService).logAuthorizationDecision(
                argThat(entry -> !entry.isAuthorized() && entry.getReason().contains("Role mismatch")));
    }

    // Dummy Service for reflection
    static class TestService {
        @Authorized(roles = { Role.MANAGER })
        public void managerOnlyMethod() {
        }
    }
}
