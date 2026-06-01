package com.roomify.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roomify.backend.config.DemoDataBootstrap;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:demodb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000",
        "roomify.demo.bootstrap.enabled=true"
})
class DemoDataBootstrapIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@roomify.demo";
    private static final String LEGACY_ADMIN_EMAIL = "admin@roomify.com";
    private static final String ADMIN_PASSWORD = "Admin@12345";

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private DemoDataBootstrap demoDataBootstrap;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void sameDaySearchReturnsDemoAvailability() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        // The presentation dataset keeps same-day inventory available while current
        // operations, arrivals, and maintenance rows refresh around the real date.
        mockMvc.perform(get("/api/rooms/search")
                        .param("checkIn", today.toString())
                        .param("checkOut", tomorrow.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalResults").isNumber());
    }

    @Test
    void rerunRefreshesRollingRowsWithoutCreatingDuplicates() throws Exception {
        Room room = roomRepository.findByRoomNumber("306").orElseThrow();
        room.setStatus(RoomStatus.OCCUPIED);
        roomRepository.save(room);

        Reservation reservation = reservationRepository.findByConfirmationNumber("RFY-GUEST-UPCOMING").orElseThrow();
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservationRepository.save(reservation);

        long reservationsBefore = reservationRepository.count();

        demoDataBootstrap.run(new DefaultApplicationArguments(new String[0]));

        // The demo bootstrap intentionally refreshes presentation-critical rows on
        // every startup, while keeping the dataset deterministic and duplicate-free.
        Room rerunRoom = roomRepository.findByRoomNumber("306").orElseThrow();
        Reservation rerunReservation = reservationRepository.findByConfirmationNumber("RFY-GUEST-UPCOMING")
                .orElseThrow();

        assertTrue(rerunRoom.getStatus() == RoomStatus.AVAILABLE || rerunRoom.getStatus() == RoomStatus.OCCUPIED);
        assertEquals(ReservationStatus.CHECKED_IN, rerunReservation.getStatus());
        assertEquals(reservationsBefore, reservationRepository.count());
    }

    @Test
    void demoBootstrapCreatesAdminAccountWithDemoPassword() {
        User adminUser = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();

        assertTrue(adminUser.isActive());
        assertEquals(Role.ADMIN, adminUser.getRole());
        assertTrue(adminUser.getRoles().contains(Role.ADMIN));
        assertTrue(passwordEncoder.matches(ADMIN_PASSWORD, adminUser.getPasswordHash()));
    }

    @Test
    void rerunRepairsLegacyAdminWithoutCreatingDuplicate() throws Exception {
        User adminUser = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        adminUser.setEmail(LEGACY_ADMIN_EMAIL);
        adminUser.setPasswordHash(passwordEncoder.encode("WrongPassword1!"));
        adminUser.setRole(Role.STAFF);
        adminUser.setRoles(java.util.EnumSet.of(Role.STAFF));
        adminUser.setActive(false);
        userRepository.save(adminUser);

        demoDataBootstrap.run(new DefaultApplicationArguments(new String[0]));

        User repairedAdmin = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        assertEquals(adminUser.getId(), repairedAdmin.getId());
        assertTrue(repairedAdmin.isActive());
        assertEquals(Role.ADMIN, repairedAdmin.getRole());
        assertTrue(repairedAdmin.getRoles().contains(Role.ADMIN));
        assertTrue(passwordEncoder.matches(ADMIN_PASSWORD, repairedAdmin.getPasswordHash()));
        assertTrue(userRepository.findByEmailIgnoreCase(LEGACY_ADMIN_EMAIL).isEmpty());
    }

    @Test
    void demoBootstrapCreatesManagerAccountWithDemoPassword() {
        User managerUser = userRepository.findByEmailIgnoreCase("manager@roomify.com").orElseThrow();

        assertTrue(managerUser.isActive());
        assertEquals(Role.MANAGER, managerUser.getRole());
        assertTrue(managerUser.getRoles().contains(Role.MANAGER));
        assertTrue(passwordEncoder.matches("Demo@2026", managerUser.getPasswordHash()));
    }

    @Test
    void demoBootstrapCreatesStaffAccountWithDemoPassword() {
        User staffUser = userRepository.findByEmailIgnoreCase("staff@roomify.com").orElseThrow();

        assertTrue(staffUser.isActive());
        assertEquals(Role.STAFF, staffUser.getRole());
        assertTrue(staffUser.getRoles().contains(Role.STAFF));
        assertTrue(passwordEncoder.matches("Demo@2026", staffUser.getPasswordHash()));
        assertEquals(0, staffUser.getFailedAttempts());
        assertEquals("Fahad Al-Harbi", staffUser.getStaff().getName());
        assertTrue(staffUser.getStaff().isActive());
    }

    @Test
    void demoBootstrapCreatesGuestAccountWithDemoPassword() {
        User guestUser = userRepository.findByEmailIgnoreCase("guest@roomify.com").orElseThrow();

        assertTrue(guestUser.isActive());
        assertEquals(Role.GUEST, guestUser.getRole());
        assertTrue(guestUser.getRoles().contains(Role.GUEST));
        assertTrue(passwordEncoder.matches("Demo@2026", guestUser.getPasswordHash()));
        assertEquals(0, guestUser.getFailedAttempts());
    }
}
