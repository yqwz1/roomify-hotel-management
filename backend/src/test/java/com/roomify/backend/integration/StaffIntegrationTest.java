package com.roomify.backend.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.StaffRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:staffdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class StaffIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String managerToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        adminToken = jwtUtils.generateToken("admin@roomify.com", "ROLE_ADMIN");
        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");

        staffRepository.deleteAll();
        userRepository.deleteAll();

        createStaffProfile("alice@roomify.com", Role.STAFF, true, "Alice Johnson", "Front Desk");
        createStaffProfile("bob@roomify.com", Role.STAFF, false, "Bob Housekeeping", "Housekeeping");
        createStaffProfile("mona@roomify.com", Role.MANAGER, true, "Mona Manager", "Management");
    }

    @Test
    void searchMatchesNameAndEmailCaseInsensitively() throws Exception {
        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "ALICE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("alice@roomify.com"))
                .andExpect(jsonPath("$[0].name").value("Alice Johnson"));

        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "mona@roomify.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].department").value("Management"));
    }

    @Test
    void filtersStaffByDepartment() throws Exception {
        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("department", "Housekeeping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("bob@roomify.com"))
                .andExpect(jsonPath("$[0].active").value(false));
    }

    @Test
    void filtersStaffByRoleAndActiveStatus() throws Exception {
        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("role", "MANAGER")
                        .param("active", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("mona@roomify.com"));

        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("role", "STAFF")
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("bob@roomify.com"));
    }

    @Test
    void createsStaffProfileWhenWelcomeTemplateIsAvailable() throws Exception {
        mockMvc.perform(post("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "new.staff@roomify.com",
                                  "name": "New Staff",
                                  "department": "Front Desk"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new.staff@roomify.com"))
                .andExpect(jsonPath("$.name").value("New Staff"))
                .andExpect(jsonPath("$.department").value("Front Desk"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void createsManagerProfileWhenRoleIsRequested() throws Exception {
        mockMvc.perform(post("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "new.manager@roomify.com",
                                  "name": "New Manager",
                                  "department": "Management",
                                  "role": "MANAGER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new.manager@roomify.com"))
                .andExpect(jsonPath("$.name").value("New Manager"))
                .andExpect(jsonPath("$.department").value("Management"))
                .andExpect(jsonPath("$.active").value(true));

        User manager = getUserByEmail("new.manager@roomify.com");
        assertEquals(Role.MANAGER, manager.getRole());
        assertEquals(Role.MANAGER, manager.getRoles().iterator().next());
        assertNotNull(manager.getStaff());
    }

    @Test
    void rejectsUnsupportedStaffCreationRole() throws Exception {
        mockMvc.perform(post("/api/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "new.admin@roomify.com",
                                  "name": "New Admin",
                                  "department": "Management",
                                  "role": "ADMIN"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.roleAllowed").value("Role must be STAFF or MANAGER"));
    }

    @Test
    void staffCannotAccessManagerOnlyStaffResources() throws Exception {
        Long aliceId = getUserIdByEmail("alice@roomify.com");
        Long bobId = getUserIdByEmail("bob@roomify.com");

        User lockedAlice = getUserByEmail("alice@roomify.com");
        lockedAlice.setFailedAttempts(4);
        lockedAlice.setLockUntil(Instant.now().plusSeconds(900));
        userRepository.saveAndFlush(lockedAlice);

        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/staff")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "blocked.staff@roomify.com",
                                  "name": "Blocked Staff",
                                  "department": "Front Desk"
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/staff/{id}", aliceId)
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Alice Escalated",
                                  "department": "Management"
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/staff/{id}/deactivate", aliceId)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/staff/{id}/activate", bobId)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/staff/{id}/unlock", aliceId)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        Staff alice = staffRepository.findById(aliceId).orElseThrow();
        Staff bob = staffRepository.findById(bobId).orElseThrow();
        User aliceUser = getUserByEmail("alice@roomify.com");
        User bobUser = getUserByEmail("bob@roomify.com");

        assertEquals("Alice Johnson", alice.getName());
        assertEquals("Front Desk", alice.getDepartment());
        assertEquals(4, aliceUser.getFailedAttempts());
        assertNotNull(aliceUser.getLockUntil());
        assertFalse(bob.isActive());
        assertFalse(bobUser.isActive());
    }

    @Test
    void managerCannotAccessAdminOnlyStaffResources() throws Exception {
        Long aliceId = getUserIdByEmail("alice@roomify.com");

        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/staff/{id}", aliceId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Alice Escalated",
                                  "department": "Management"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanUpdateActivationAndUnlockStaffLifecycleEndpoints() throws Exception {
        Long aliceId = getUserIdByEmail("alice@roomify.com");

        mockMvc.perform(put("/api/staff/{id}", aliceId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Alice Updated",
                                  "department": "Concierge"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice Updated"))
                .andExpect(jsonPath("$.department").value("Concierge"));

        Staff updated = staffRepository.findById(aliceId).orElseThrow();
        assertEquals("Alice Updated", updated.getName());
        assertEquals("Concierge", updated.getDepartment());

        mockMvc.perform(patch("/api/staff/{id}/deactivate", aliceId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        assertFalse(staffRepository.findById(aliceId).orElseThrow().isActive());
        assertFalse(getUserByEmail("alice@roomify.com").isActive());

        mockMvc.perform(patch("/api/staff/{id}/activate", aliceId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        User lockedAlice = getUserByEmail("alice@roomify.com");
        lockedAlice.setFailedAttempts(5);
        lockedAlice.setLockUntil(Instant.now().plusSeconds(900));
        userRepository.saveAndFlush(lockedAlice);

        mockMvc.perform(patch("/api/staff/{id}/unlock", aliceId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@roomify.com"))
                .andExpect(jsonPath("$.locked").value(false))
                .andExpect(jsonPath("$.failedAttempts").value(0));

        User unlockedAlice = getUserByEmail("alice@roomify.com");
        assertEquals(0, unlockedAlice.getFailedAttempts());
        assertNull(unlockedAlice.getLockUntil());
    }

    @Test
    void adminCanSoftDeleteStaffMemberDisablingLoginWhileKeepingRow() throws Exception {
        Long aliceId = getUserIdByEmail("alice@roomify.com");

        mockMvc.perform(delete("/api/staff/{id}", aliceId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@roomify.com"))
                .andExpect(jsonPath("$.active").value(false));

        // Row is soft-deleted, not removed: both staff and user records still exist.
        Staff alice = staffRepository.findById(aliceId).orElseThrow();
        User aliceUser = getUserByEmail("alice@roomify.com");
        assertFalse(alice.isActive());
        assertFalse(aliceUser.isActive());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "alice@roomify.com",
                                  "password": "irrelevant"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Account is inactive"));
    }

    @Test
    void adminCanSoftDeleteManagerDisablingLoginWhileKeepingRow() throws Exception {
        Long monaId = getUserIdByEmail("mona@roomify.com");

        mockMvc.perform(delete("/api/staff/{id}", monaId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("mona@roomify.com"))
                .andExpect(jsonPath("$.active").value(false));

        Staff mona = staffRepository.findById(monaId).orElseThrow();
        User monaUser = getUserByEmail("mona@roomify.com");
        assertEquals(Role.MANAGER, monaUser.getRole());
        assertFalse(mona.isActive());
        assertFalse(monaUser.isActive());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "mona@roomify.com",
                                  "password": "irrelevant"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Account is inactive"));
    }

    @Test
    void nonAdminCannotSoftDeleteStaff() throws Exception {
        Long aliceId = getUserIdByEmail("alice@roomify.com");

        mockMvc.perform(delete("/api/staff/{id}", aliceId)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/staff/{id}", aliceId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        Staff alice = staffRepository.findById(aliceId).orElseThrow();
        assertTrue(alice.isActive());
        assertTrue(getUserByEmail("alice@roomify.com").isActive());
    }

    private Long getUserIdByEmail(String email) {
        return getUserByEmail(email).getId();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    private void createStaffProfile(String email, Role role, boolean active, String name, String department) {
        User user = new User(email, "hashed-password", role, active);
        Staff staff = new Staff(user, name, department);
        staff.setActive(active);
        user.setStaff(staff);
        userRepository.save(user);
    }
}
