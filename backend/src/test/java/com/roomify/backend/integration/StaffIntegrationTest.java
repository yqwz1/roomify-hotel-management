package com.roomify.backend.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.StaffRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Import;
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

    private String managerToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");

        staffRepository.deleteAll();
        userRepository.deleteAll();

        createStaffProfile("alice@roomify.com", Role.STAFF, true, "Alice Johnson", "Front Desk");
        createStaffProfile("bob@roomify.com", Role.STAFF, false, "Bob Housekeeping", "Housekeeping");
        createStaffProfile("mona@roomify.com", Role.MANAGER, true, "Mona Manager", "Management");
    }

    @Test
    void searchMatchesNameAndEmailCaseInsensitively() throws Exception {
        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("search", "ALICE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("alice@roomify.com"))
                .andExpect(jsonPath("$[0].name").value("Alice Johnson"));

        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("search", "mona@roomify.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].department").value("Management"));
    }

    @Test
    void filtersStaffByDepartment() throws Exception {
        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("department", "Housekeeping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("bob@roomify.com"))
                .andExpect(jsonPath("$[0].active").value(false));
    }

    @Test
    void filtersStaffByRoleAndActiveStatus() throws Exception {
        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("role", "MANAGER")
                        .param("active", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("mona@roomify.com"));

        mockMvc.perform(get("/api/staff")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("role", "STAFF")
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("bob@roomify.com"));
    }

    @Test
    void createsStaffProfileWhenWelcomeTemplateIsAvailable() throws Exception {
        mockMvc.perform(post("/api/staff")
                        .header("Authorization", "Bearer " + managerToken)
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

    private void createStaffProfile(String email, Role role, boolean active, String name, String department) {
        User user = new User(email, "hashed-password", role, active);
        Staff staff = new Staff(user, name, department);
        staff.setActive(active);
        user.setStaff(staff);
        userRepository.save(user);
    }
}
