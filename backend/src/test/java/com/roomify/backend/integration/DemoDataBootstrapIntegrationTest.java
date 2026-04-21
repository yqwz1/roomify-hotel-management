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

        mockMvc.perform(get("/api/rooms/search")
                        .param("checkIn", today.toString())
                        .param("checkOut", tomorrow.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalResults").value(5));
    }

    @Test
    void rerunResetsMutatedDemoFixtures() throws Exception {
        Room room = roomRepository.findByRoomNumber("D101").orElseThrow();
        room.setStatus(RoomStatus.OCCUPIED);
        roomRepository.save(room);

        Reservation reservation = reservationRepository.findByConfirmationNumber("DEMO-CHECKIN-READY").orElseThrow();
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setCheckInDate(LocalDate.now().minusDays(2));
        reservation.setCheckOutDate(LocalDate.now().minusDays(1));
        reservationRepository.save(reservation);

        demoDataBootstrap.run(new DefaultApplicationArguments(new String[0]));

        Room resetRoom = roomRepository.findByRoomNumber("D101").orElseThrow();
        Reservation resetReservation = reservationRepository.findByConfirmationNumber("DEMO-CHECKIN-READY")
                .orElseThrow();

        assertEquals(RoomStatus.AVAILABLE, resetRoom.getStatus());
        assertEquals(ReservationStatus.CONFIRMED, resetReservation.getStatus());
        assertEquals(LocalDate.now(), resetReservation.getCheckInDate());
        assertEquals(LocalDate.now().plusDays(1), resetReservation.getCheckOutDate());
        assertTrue(resetReservation.getTotalPrice().signum() > 0);
    }

    @Test
    void demoBootstrapKeepsDocumentedAdminLoginUsable() {
        User adminUser = userRepository.findByEmailIgnoreCase("admin@roomify.com").orElseThrow();

        assertTrue(adminUser.isActive());
        assertEquals(Role.ADMIN, adminUser.getRole());
        assertTrue(passwordEncoder.matches("password123", adminUser.getPasswordHash()));
    }
}
