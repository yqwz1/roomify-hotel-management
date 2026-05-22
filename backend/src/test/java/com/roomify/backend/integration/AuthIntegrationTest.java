package com.roomify.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.notification.EmailNotification;
import com.roomify.backend.notification.EmailNotificationRepository;
import com.roomify.backend.notification.NotificationDeliveryStatus;
import com.roomify.backend.notification.NotificationType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * Integration tests for authentication flows (login, refresh token).
 */
@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class AuthIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private EmailNotificationRepository emailNotificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();
        emailNotificationRepository.deleteAll();
        userRepository.deleteAll();
        guestRepository.deleteAll();
    }

    @Test
    void loginWithCorrectCredentialsReturnsToken() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@roomify.com",
                "password", "password123"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("admin@roomify.com"))
                .andExpect(jsonPath("$.username").value("Admin"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$.roles[1]").value("ROLE_MANAGER"));
    }

    @Test
    void loginWithPersistedStaffCredentialsReturnsStaffRole() throws Exception {
        User user = new User("staff.member@roomify.com", passwordEncoder.encode("Strong@Pass123"), Role.STAFF, true);
        Staff staff = new Staff(user, "Staff Member", "Front Desk");
        user.setStaff(staff);
        userRepository.save(user);

        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "staff.member@roomify.com",
                "password", "Strong@Pass123"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("staff.member@roomify.com"))
                .andExpect(jsonPath("$.username").value("Staff Member"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_STAFF"));
    }

    @Test
    void loginWithPersistedGuestCredentialsReturnsGuestRole() throws Exception {
        User user = new User("demo.guest@roomify.dev", passwordEncoder.encode("password123"), Role.GUEST, true);
        userRepository.save(user);

        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "demo.guest@roomify.dev",
                "password", "password123"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("demo.guest@roomify.dev"))
                .andExpect(jsonPath("$.username").value("demo.guest@roomify.dev"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_GUEST"));
    }

    @Test
    void registerGuestCreatesLoginAccountAndGuestProfile() throws Exception {
        String registerJson = objectMapper.writeValueAsString(Map.of(
                "name", "Guest Member",
                "email", "guest.member@roomify.dev",
                "password", "Strong@Pass123"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.guestId").isNumber())
                .andExpect(jsonPath("$.name").value("Guest Member"))
                .andExpect(jsonPath("$.email").value("guest.member@roomify.dev"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_GUEST"));

        User savedUser = userRepository.findByEmailIgnoreCase("guest.member@roomify.dev").orElseThrow();
        Guest savedGuest = guestRepository.findByEmailIgnoreCase("guest.member@roomify.dev").orElseThrow();

        assertThat(passwordEncoder.matches("Strong@Pass123", savedUser.getPasswordHash())).isTrue();
        assertThat(savedUser.getRole()).isEqualTo(Role.GUEST);
        assertThat(savedGuest.getName()).isEqualTo("Guest Member");

        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "guest.member@roomify.dev",
                "password", "Strong@Pass123"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("guest.member@roomify.dev"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_GUEST"));

        EmailNotification welcomeNotification = waitForGuestWelcome("guest.member@roomify.dev");
        assertThat(welcomeNotification.getStatus()).isNotEqualTo(NotificationDeliveryStatus.FAILED);
        assertThat(welcomeNotification.getType()).isEqualTo(NotificationType.GUEST_WELCOME);
        assertThat(welcomeNotification.getTemplateName()).isEqualTo("email/notification-email");
        assertThat(welcomeNotification.getTemplatePayload())
                .doesNotContain("Strong@Pass123")
                .doesNotContain("password")
                .doesNotContain("Password");
    }

    @Test
    void registerGuestRejectsExistingUserEmail() throws Exception {
        userRepository.save(new User(
                "guest.member@roomify.dev",
                passwordEncoder.encode("Strong@Pass123"),
                Role.GUEST,
                true));

        String registerJson = objectMapper.writeValueAsString(Map.of(
                "name", "Guest Member",
                "email", "guest.member@roomify.dev",
                "password", "Strong@Pass123"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    void registerGuestRejectsExistingGuestProfileEmail() throws Exception {
        guestRepository.save(new Guest(
                "Existing Guest",
                "guest.member@roomify.dev",
                "PENDING",
                "SELF-EXISTING",
                "UNKNOWN"));

        String registerJson = objectMapper.writeValueAsString(Map.of(
                "name", "Guest Member",
                "email", "guest.member@roomify.dev",
                "password", "Strong@Pass123"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    private EmailNotification waitForGuestWelcome(String email) throws InterruptedException {
        for (int attempt = 0; attempt < 20; attempt++) {
            List<EmailNotification> notifications =
                    emailNotificationRepository.search(email, null, NotificationType.GUEST_WELCOME);
            if (!notifications.isEmpty()) {
                return notifications.get(0);
            }
            Thread.sleep(100);
        }

        List<EmailNotification> notifications =
                emailNotificationRepository.search(email, null, NotificationType.GUEST_WELCOME);
        if (!notifications.isEmpty()) {
            return notifications.get(0);
        }
        throw new AssertionError("Expected GUEST_WELCOME notification for " + email);
    }

    @Test
    void loginWithWrongPasswordReturnsUnauthorized() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@roomify.com",
                "password", "wrongpassword"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Wrong email or password"));
    }

    @Test
    void loginWithNonExistentEmailReturnsUnauthorized() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "nonexistent@roomify.com",
                "password", "password123"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Wrong email or password"));
    }

    @Test
    void loginTokenWorksForAuthenticatedEndpoints() throws Exception {
        // First, login to get token
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@roomify.com",
                "password", "password123"));

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token")
                .asText();

        // Use token to access an admin endpoint
        mockMvc.perform(get("/api/staff")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void refreshTokenWithValidTokenReturnsNewToken() throws Exception {
        String validToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        String refreshJson = objectMapper.writeValueAsString(Map.of("token", validToken));

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andReturn();

        String newToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();

        // Verify new token works
        mockMvc.perform(get("/api/rooms")
                .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk());
    }

    @Test
    void refreshTokenWithMultipleRolesPreservesAllRoles() throws Exception {
        String validToken = jwtUtils.generateToken(
                "owner@roomify.com",
                java.util.List.of("ROLE_ADMIN", "ROLE_MANAGER"));
        String refreshJson = objectMapper.writeValueAsString(Map.of("token", validToken));

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson))
                .andExpect(status().isOk())
                .andReturn();

        String newToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();

        mockMvc.perform(get("/api/staff")
                .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/dashboard/metrics")
                .header("Authorization", "Bearer " + newToken)
                .param("startDate", "2026-04-01")
                .param("endDate", "2026-04-30"))
                .andExpect(status().isOk());
    }

    @Test
    void refreshTokenWithInvalidTokenReturnsUnauthorized() throws Exception {
        String refreshJson = objectMapper.writeValueAsString(Map.of("token", "invalid.token.here"));

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid token"));
    }

    @Test
    void loginWithInvalidEmailFormatReturnsBadRequest() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "not-an-email",
                "password", "password123"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginWithMissingFieldsReturnsBadRequest() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@roomify.com"
        // password missing
        ));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isBadRequest());
    }
}
