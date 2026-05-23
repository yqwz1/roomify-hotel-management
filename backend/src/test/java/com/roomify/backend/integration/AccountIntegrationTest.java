package com.roomify.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:accountdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class AccountIntegrationTest {

    private static final String PASSWORD = "Strong@Pass123";

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
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void deleteCurrentAccountSoftDeletesUserAndPreservesGuestDataAndReservations() throws Exception {
        String email = "self-delete.guest@roomify.dev";
        User user = seedUser(email, Role.GUEST);
        Guest guest = guestRepository.save(new Guest(
                "Self Delete Guest",
                email,
                "+966500000000",
                "SELF-DELETE-001",
                "Saudi"));
        Reservation reservation = seedReservation(guest);
        String token = jwtUtils.generateToken(email, "ROLE_GUEST");

        mockMvc.perform(delete("/api/account")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        User savedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(savedUser.isActive()).isFalse();
        assertThat(userRepository.findByEmailIgnoreCase(email)).isPresent();
        assertThat(guestRepository.findById(guest.getId())).isPresent();
        assertThat(reservationRepository.findById(reservation.getId())).isPresent();

        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", email,
                "password", PASSWORD));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Account is inactive"));
    }

    @Test
    void deleteCurrentAccountCannotDeleteAnotherUser() throws Exception {
        User currentUser = seedUser("current.guest@roomify.dev", Role.GUEST);
        User otherUser = seedUser("other.guest@roomify.dev", Role.GUEST);
        String token = jwtUtils.generateToken(currentUser.getEmail(), "ROLE_GUEST");

        mockMvc.perform(delete("/api/account")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", otherUser.getEmail()))))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(currentUser.getId()).orElseThrow().isActive()).isFalse();
        assertThat(userRepository.findById(otherUser.getId()).orElseThrow().isActive()).isTrue();
    }

    @Test
    void deleteCurrentAccountRequiresAuthentication() throws Exception {
        mockMvc.perform(delete("/api/account"))
                .andExpect(status().isUnauthorized());
    }

    private User seedUser(String email, Role role) {
        return userRepository.save(new User(email, passwordEncoder.encode(PASSWORD), role, true));
    }

    private Reservation seedReservation(Guest guest) {
        RoomType roomType = roomTypeRepository.save(new RoomType(
                "Account Test Suite",
                new BigDecimal("200.00"),
                2,
                "WiFi",
                "Account test room"));
        Room room = roomRepository.save(new Room("AT-501", roomType, 5, RoomStatus.AVAILABLE));
        Reservation reservation = new Reservation(
                guest,
                room,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                new BigDecimal("400.00"),
                ReservationStatus.CONFIRMED,
                "ACC-SELF-001");
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(new BigDecimal("400.00"));
        return reservationRepository.save(reservation);
    }
}
