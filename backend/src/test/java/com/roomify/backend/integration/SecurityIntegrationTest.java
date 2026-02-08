package com.roomify.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:integrationdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class SecurityIntegrationTest {

    private static final String OTHER_SECRET =
            "1111111111111111111111111111111111111111111111111111111111111111";

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    private ObjectMapper objectMapper;

    @Value("${roomify.jwt.secret}")
    private String secret;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();
    }

    static Stream<Arguments> allowedRoleEndpoints() {
        return Stream.of(
                Arguments.of("ROLE_MANAGER", "/api/test/manager/summary", "manager-summary"),
                Arguments.of("ROLE_MANAGER", "/api/test/manager/reports", "manager-reports"),
                Arguments.of("ROLE_STAFF", "/api/test/staff/summary", "staff-summary"),
                Arguments.of("ROLE_STAFF", "/api/test/staff/schedule", "staff-schedule"),
                Arguments.of("ROLE_GUEST", "/api/test/guest/summary", "guest-summary"),
                Arguments.of("ROLE_GUEST", "/api/test/guest/profile", "guest-profile")
        );
    }

    static Stream<Arguments> crossRoleEndpoints() {
        return Stream.of(
                Arguments.of("ROLE_STAFF", "/api/test/manager/summary"),
                Arguments.of("ROLE_GUEST", "/api/test/staff/summary"),
                Arguments.of("ROLE_MANAGER", "/api/test/guest/summary"),
                Arguments.of("ROLE_GUEST", "/api/test/shared/frontdesk")
        );
    }

    @ParameterizedTest
    @MethodSource("allowedRoleEndpoints")
    void allowsAccessWithValidToken(String role, String endpoint, String expectedBody) throws Exception {
        String token = jwtUtils.generateToken(role.toLowerCase() + "@roomify.com", role);

        mockMvc.perform(get(endpoint)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().string(expectedBody));
    }

    @Test
    void sharedEndpointAllowsManagerAndStaff() throws Exception {
        String managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        String staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");

        mockMvc.perform(get("/api/test/shared/frontdesk")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(content().string("shared-frontdesk"));

        mockMvc.perform(get("/api/test/shared/frontdesk")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(content().string("shared-frontdesk"));
    }

    @ParameterizedTest
    @MethodSource("crossRoleEndpoints")
    void deniesAccessWithWrongRole(String role, String endpoint) throws Exception {
        String token = jwtUtils.generateToken("user@roomify.com", role);

        mockMvc.perform(get(endpoint)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/test/manager/summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Missing token"));
    }

    @Test
    void malformedTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/test/manager/summary")
                        .header("Authorization", "Bearer not.a.jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid token"));
    }

    @Test
    void invalidSignatureReturnsUnauthorized() throws Exception {
        String token = Jwts.builder()
                .setSubject("tampered@roomify.com")
                .claim("role", "ROLE_MANAGER")
                .setIssuedAt(new Date(System.currentTimeMillis() - 1000))
                .setExpiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(Keys.hmacShaKeyFor(OTHER_SECRET.getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/test/manager/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid token"));
    }

    @Test
    void expiredTokenReturnsUnauthorized() throws Exception {
        String token = Jwts.builder()
                .setSubject("expired@roomify.com")
                .claim("role", "ROLE_MANAGER")
                .setIssuedAt(new Date(System.currentTimeMillis() - 60000))
                .setExpiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/test/manager/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Token expired"));
    }

    @Test
    void refreshTokenReturnsNewAccessToken() throws Exception {
        String token = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        String payload = objectMapper.writeValueAsString(Map.of("token", token));

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andReturn();

        String refreshed = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();

        Claims claims = jwtUtils.parseClaims(refreshed);
        assertEquals("manager@roomify.com", claims.getSubject());
        assertEquals("ROLE_MANAGER", claims.get("role", String.class));
        assertTrue(jwtUtils.validateToken(refreshed));
    }

    @Test
    void refreshTokenRejectsInvalidToken() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of("token", "invalid.token"));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid token"));
    }
}
