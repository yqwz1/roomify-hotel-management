package com.roomify.backend.security;

import com.roomify.backend.entity.Department;
import com.roomify.backend.entity.Role;
import com.roomify.backend.entity.User;
import com.roomify.backend.repository.UserRepository;
import com.roomify.backend.service.AuthorizationLoggingService;
import com.roomify.backend.service.dto.AuthorizationLogEntry;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;

@Aspect
@Component
public class SecurityAspect {

    private final UserRepository userRepository;
    private final AuthorizationLoggingService loggingService;

    public SecurityAspect(
            UserRepository userRepository,
            AuthorizationLoggingService loggingService
    ) {
        this.userRepository = userRepository;
        this.loggingService = loggingService;
    }

    @Before("@annotation(com.roomify.backend.security.Authorized)")
    public void checkAuthorization(JoinPoint joinPoint) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 401 - Not authenticated
        if (authentication == null || !authentication.isAuthenticated()) {

            loggingService.logAuthorizationDecision(
                    new AuthorizationLogEntry(
                            null,
                            "ANONYMOUS",
                            joinPoint.getSignature().getName(),
                            joinPoint.getTarget().getClass().getSimpleName(),
                            false,
                            "Unauthenticated access attempt",
                            "N/A"
                    )
            );

            throw new AccessDeniedException("User not authenticated");
        }

        String email = (String) authentication.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Authorized authorized = method.getAnnotation(Authorized.class);

        // 1️⃣ Role check
        Role[] allowedRoles = authorized.roles();
        if (allowedRoles.length > 0) {
            boolean roleMatch = Arrays.stream(allowedRoles)
                    .anyMatch(r -> r == user.getRole());

            if (!roleMatch) {
                logAndThrow(user, joinPoint,
                        "Role mismatch. Required: " + Arrays.toString(allowedRoles));
            }
        }

        // 2️⃣ Department check
        if (authorized.requireSameDepartment()) {
            for (Object arg : joinPoint.getArgs()) {
                if (arg instanceof Department department) {
                    if (department != user.getDepartment()) {
                        logAndThrow(user, joinPoint,
                                "Department mismatch. User: " + user.getDepartment()
                                        + ", Target: " + department);
                    }
                }
            }
        }

        // Access Granted
        loggingService.logAuthorizationDecision(
                new AuthorizationLogEntry(
                        user.getId(),
                        user.getEmail(),
                        method.getName(),
                        joinPoint.getTarget().getClass().getSimpleName(),
                        true,
                        "Access Granted",
                        user.getDepartment() != null ? user.getDepartment().name() : "N/A"
                )
        );
    }

    private void logAndThrow(User user, JoinPoint joinPoint, String reason) {

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();

        loggingService.logAuthorizationDecision(
                new AuthorizationLogEntry(
                        user.getId(),
                        user.getEmail(),
                        signature.getMethod().getName(),
                        joinPoint.getTarget().getClass().getSimpleName(),
                        false,
                        reason,
                        user.getDepartment() != null ? user.getDepartment().name() : "N/A"
                )
        );

        throw new AccessDeniedException("Access Denied: " + reason);
    }
}
