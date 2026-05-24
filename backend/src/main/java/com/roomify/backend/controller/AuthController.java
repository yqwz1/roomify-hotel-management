package com.roomify.backend.controller;

import com.roomify.backend.dto.ApiError;
import com.roomify.backend.dto.JwtResponse;
import com.roomify.backend.dto.LoginRequest;
import com.roomify.backend.dto.RegisterRequest;
import com.roomify.backend.dto.TokenRefreshRequest;
import com.roomify.backend.dto.TokenRefreshResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.notification.PasswordResetService;
import com.roomify.backend.notification.dto.PasswordResetConfirmRequest;
import com.roomify.backend.notification.dto.PasswordResetRequest;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.service.AuditService;
import com.roomify.backend.service.GuestRegistrationService;
import com.roomify.backend.service.UserService;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.roomify.backend.config.JwtUtils;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private static final String DEMO_ADMIN_EMAIL = "admin@roomify.com";
        private static final String DEMO_MANAGER_EMAIL = "manager@roomify.com";
        private static final String DEMO_STAFF_EMAIL = "staff@roomify.com";
        private static final String DEMO_GUEST_EMAIL = "guest@roomify.com";
        private static final String DEMO_ADMIN_PASSWORD = "RealAdminPass123!";
        private static final String DEMO_PASSWORD = "Demo@2026";

        private final AuditService auditService;
        private final JwtUtils jwtUtils;
        private final UserRepository userRepository;
        private final GuestRepository guestRepository;
        private final UserService userService;
        private final PasswordEncoder passwordEncoder;
        private final PasswordResetService passwordResetService;
        private final GuestRegistrationService guestRegistrationService;
        private final boolean demoBootstrapEnabled;

        public AuthController(
                        AuditService auditService,
                        JwtUtils jwtUtils,
                        UserRepository userRepository,
                        GuestRepository guestRepository,
                        UserService userService,
                        PasswordEncoder passwordEncoder,
                        PasswordResetService passwordResetService,
                        GuestRegistrationService guestRegistrationService,
                        @Value("${roomify.demo.bootstrap.enabled:true}") boolean demoBootstrapEnabled) {
                this.auditService = auditService;
                this.jwtUtils = jwtUtils;
                this.userRepository = userRepository;
                this.guestRepository = guestRepository;
                this.userService = userService;
                this.passwordEncoder = passwordEncoder;
                this.passwordResetService = passwordResetService;
                this.guestRegistrationService = guestRegistrationService;
                this.demoBootstrapEnabled = demoBootstrapEnabled;
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(
                        @Valid @RequestBody LoginRequest request,
                        HttpServletRequest httpRequest) {

                String ipAddress = httpRequest.getRemoteAddr();
                String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
                ensureDemoUserIfApplicable(email, request.getPassword());

                Optional<User> userCandidate = userRepository.findByEmailIgnoreCase(email);
                if (userCandidate.isPresent()) {
                        User user = userCandidate.get();

                        if (!user.isActive()) {
                                auditFailure(email, ipAddress, "inactive");
                                return unauthorized(httpRequest, "Account is inactive");
                        }

                        if (userService.isAccountLocked(user)) {
                                auditFailure(email, ipAddress, "locked");
                                return unauthorized(httpRequest, "Account is temporarily locked");
                        }

                        if (matchesPassword(user, request.getPassword())) {
                                userService.resetFailedAttempts(user);
                                auditSuccess(email, ipAddress);
                                return ResponseEntity.ok(buildJwtResponse(user));
                        }

                        userService.handleFailedLogin(user);
                        auditFailure(email, ipAddress, "wrong-password");
                        return unauthorized(httpRequest, "Wrong email or password");
                }

                auditFailure(email, ipAddress, "wrong-email-or-password");
                return unauthorized(httpRequest, "Wrong email or password");
        }

        @PostMapping("/register")
        public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(guestRegistrationService.register(request));
        }

        @PostMapping("/refresh")
        public ResponseEntity<?> refresh(
                        @Valid @RequestBody TokenRefreshRequest request,
                        HttpServletRequest httpRequest) {
                String token = request.getToken();
                try {
                        Claims claims = jwtUtils.parseClaims(token);
                        String email = claims.getSubject();
                        List<String> roles = jwtUtils.extractRoles(claims);

                        if (email == null || email.isBlank()) {
                                ApiError error = new ApiError(
                                                HttpStatus.UNAUTHORIZED.value(),
                                                "Unauthorized",
                                                "Invalid token subject",
                                                httpRequest.getRequestURI()
                                );
                                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                        }

                        if (roles.isEmpty()) {
                                ApiError error = new ApiError(
                                                HttpStatus.UNAUTHORIZED.value(),
                                                "Unauthorized",
                                                "Invalid token role",
                                                httpRequest.getRequestURI()
                                );
                                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                        }

                        String newToken = jwtUtils.generateToken(email, roles);
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

        @PostMapping("/password-reset/request")
        public ResponseEntity<Void> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
                passwordResetService.requestReset(request, LocaleContextHolder.getLocale().toLanguageTag());
                return ResponseEntity.accepted().build();
        }

        @PostMapping("/password-reset/confirm")
        public ResponseEntity<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
                passwordResetService.confirmReset(request);
                return ResponseEntity.noContent().build();
        }

        private boolean matchesPassword(User user, String rawPassword) {
                try {
                        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
                } catch (IllegalArgumentException ex) {
                        return false;
                }
        }

        private void ensureDemoUserIfApplicable(String email, String rawPassword) {
                if (!demoBootstrapEnabled || rawPassword == null || rawPassword.isBlank()) {
                        return;
                }

                DemoAccount demoAccount = resolveDemoAccount(email, rawPassword);
                if (demoAccount == null) {
                        return;
                }

                User user = userRepository.findByEmailIgnoreCase(demoAccount.email())
                                .orElseGet(() -> new User(
                                                demoAccount.email(),
                                                passwordEncoder.encode(demoAccount.password()),
                                                demoAccount.primaryRole(),
                                                true));

                user.setEmail(demoAccount.email());
                user.setPasswordHash(passwordEncoder.encode(demoAccount.password()));
                user.setRole(demoAccount.primaryRole());
                user.setRoles(demoAccount.roles());
                user.setActive(true);
                user.setFailedAttempts(0);
                user.setLockUntil(null);

                if (demoAccount.primaryRole() == Role.STAFF) {
                        Staff staff = user.getStaff() != null
                                        ? user.getStaff()
                                        : new Staff(user, "Demo Staff", "Front Desk");
                        user.setStaff(staff);
                        staff.setUser(user);
                        staff.setName("Demo Staff");
                        staff.setDepartment("Front Desk");
                        staff.setActive(true);
                        staff.setDeleted(false);
                }

                userRepository.save(user);

                if (demoAccount.primaryRole() == Role.GUEST) {
                        Guest guest = guestRepository.findByEmailIgnoreCase(demoAccount.email())
                                        .orElseGet(Guest::new);
                        guest.setName("Demo Guest");
                        guest.setEmail(demoAccount.email());
                        guest.setPhone("+966500000111");
                        guest.setIdNumber("ROOMIFY-DEMO-GUEST-LOGIN");
                        guest.setNationality("SA");
                        guestRepository.save(guest);
                }
        }

        private DemoAccount resolveDemoAccount(String email, String rawPassword) {
                if (DEMO_ADMIN_EMAIL.equalsIgnoreCase(email) && DEMO_ADMIN_PASSWORD.equals(rawPassword)) {
                        return new DemoAccount(
                                        DEMO_ADMIN_EMAIL,
                                        DEMO_ADMIN_PASSWORD,
                                        Role.ADMIN,
                                        EnumSet.of(Role.ADMIN, Role.MANAGER, Role.STAFF));
                }
                if (DEMO_MANAGER_EMAIL.equalsIgnoreCase(email) && DEMO_PASSWORD.equals(rawPassword)) {
                        return new DemoAccount(
                                        DEMO_MANAGER_EMAIL,
                                        DEMO_PASSWORD,
                                        Role.MANAGER,
                                        EnumSet.of(Role.MANAGER));
                }
                if (DEMO_STAFF_EMAIL.equalsIgnoreCase(email) && DEMO_PASSWORD.equals(rawPassword)) {
                        return new DemoAccount(
                                        DEMO_STAFF_EMAIL,
                                        DEMO_PASSWORD,
                                        Role.STAFF,
                                        EnumSet.of(Role.STAFF));
                }
                if (DEMO_GUEST_EMAIL.equalsIgnoreCase(email) && DEMO_PASSWORD.equals(rawPassword)) {
                        return new DemoAccount(
                                        DEMO_GUEST_EMAIL,
                                        DEMO_PASSWORD,
                                        Role.GUEST,
                                        EnumSet.of(Role.GUEST));
                }
                return null;
        }

        private JwtResponse buildJwtResponse(User user) {
                List<String> roles = user.getRoles().stream()
                                .map(role -> "ROLE_" + role.name())
                                .toList();
                String displayName = user.getStaff() != null && user.getStaff().getName() != null
                                && !user.getStaff().getName().isBlank()
                                                ? user.getStaff().getName()
                                                : user.getEmail();

                return new JwtResponse(
                                jwtUtils.generateToken(user.getEmail(), roles),
                                user.getId(),
                                displayName,
                                user.getEmail(),
                                roles);
        }

        private void auditSuccess(String email, String ipAddress) {
                auditService.log(
                                "LOGIN_SUCCESS",
                                email,
                                "{\"ip\":\"" + ipAddress + "\"}");
        }

        private void auditFailure(String email, String ipAddress, String reason) {
                auditService.log(
                                "LOGIN_FAILURE",
                                email,
                                "{\"ip\":\"" + ipAddress + "\",\"reason\":\"" + reason + "\"}");
        }

        private ResponseEntity<ApiError> unauthorized(HttpServletRequest httpRequest, String message) {
                ApiError error = new ApiError(
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                message,
                                httpRequest.getRequestURI());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        private record DemoAccount(String email, String password, Role primaryRole, EnumSet<Role> roles) {
        }
}
