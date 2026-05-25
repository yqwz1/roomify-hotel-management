package com.roomify.backend.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.roomify.backend.entity.ServiceRequest;
import com.roomify.backend.entity.ServiceRequestPriority;
import com.roomify.backend.entity.ServiceRequestStatus;
import com.roomify.backend.entity.ServiceRequestType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.repository.ServiceRequestRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
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
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:servicerequestdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
                "spring.datasource.driverClassName=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
                "roomify.jwt.expiration=3600000",
                "roomify.billing.vat-rate=0.15"
        }
)
class ServiceRequestIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String guestToken;
    private String staffToken;
    private Room activeRoom;
    private Room pastRoom;
    private Room otherGuestRoom;
    private Guest guest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        serviceRequestRepository.deleteAll();
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();
        userRepository.deleteAll();

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("250.00"), 2, "WiFi", "Deluxe room"));

        activeRoom = roomRepository.save(new Room("401", roomType, 4, RoomStatus.AVAILABLE));
        pastRoom = roomRepository.save(new Room("402", roomType, 4, RoomStatus.AVAILABLE));
        otherGuestRoom = roomRepository.save(new Room("403", roomType, 4, RoomStatus.AVAILABLE));

        guest = guestRepository.save(
                new Guest("Guest User", "guest@roomify.com", "0500000001", "ID-GUEST-001", "SA"));
        Guest otherGuest = guestRepository.save(
                new Guest("Other Guest", "other@roomify.com", "0500000002", "ID-GUEST-002", "SA"));

        userRepository.save(new User("guest@roomify.com", "encoded", Role.GUEST, true));
        userRepository.save(new User("staff@roomify.com", "encoded", Role.STAFF, true));

        guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");

        reservationRepository.save(buildReservation(
                guest,
                activeRoom,
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                ReservationStatus.CONFIRMED,
                "RSV-ACTIVE-001"));
        reservationRepository.save(buildReservation(
                guest,
                pastRoom,
                LocalDate.now().minusDays(5),
                LocalDate.now().minusDays(2),
                ReservationStatus.CHECKED_OUT,
                "RSV-PAST-001"));
        reservationRepository.save(buildReservation(
                otherGuest,
                otherGuestRoom,
                LocalDate.now(),
                LocalDate.now().plusDays(3),
                ReservationStatus.CONFIRMED,
                "RSV-OTHER-001"));
    }

    @Test
    void guestCanCreateAndListOwnServiceRequests() throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("roomId", activeRoom.getId());
        request.put("serviceType", "ROOM_CLEANING");
        request.put("description", "Fresh towels and a quick tidy-up.");
        request.put("priority", "HIGH");

        mockMvc.perform(post("/api/guest/service-requests")
                        .header("Authorization", "Bearer " + guestToken)
                        .characterEncoding(StandardCharsets.UTF_8.name())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.guestId").value(guest.getId()))
                .andExpect(jsonPath("$.roomId").value(activeRoom.getId()))
                .andExpect(jsonPath("$.roomNumber").value("401"))
                .andExpect(jsonPath("$.serviceType").value("ROOM_CLEANING"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(get("/api/guest/service-requests")
                        .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].description").value("Fresh towels and a quick tidy-up."));
    }

    @Test
    void guestCannotCreateRequestForPastOrForeignRoom() throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("serviceType", "MAINTENANCE");
        request.put("description", "The AC needs attention.");

        mockMvc.perform(post("/api/guest/service-requests")
                        .header("Authorization", "Bearer " + guestToken)
                        .characterEncoding(StandardCharsets.UTF_8.name())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writeServiceRequestPayload(request, pastRoom.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Selected room is not part of an active reservation."));

        mockMvc.perform(post("/api/guest/service-requests")
                        .header("Authorization", "Bearer " + guestToken)
                        .characterEncoding(StandardCharsets.UTF_8.name())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writeServiceRequestPayload(request, otherGuestRoom.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Selected room is not part of an active reservation."));
    }

    @Test
    void staffCanListAndUpdateServiceRequests() throws Exception {
        ServiceRequest request = new ServiceRequest();
        request.setGuest(guest);
        request.setRoom(activeRoom);
        request.setServiceType(ServiceRequestType.FOOD_DELIVERY);
        request.setDescription("Please send breakfast by 8 AM.");
        request.setPriority(ServiceRequestPriority.MEDIUM);
        request.setStatus(ServiceRequestStatus.PENDING);
        ServiceRequest saved = serviceRequestRepository.save(request);

        mockMvc.perform(get("/api/staff/service-requests")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].guestName").value("Guest User"))
                .andExpect(jsonPath("$[0].roomNumber").value("401"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        mockMvc.perform(patch("/api/staff/service-requests/{id}", saved.getId())
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "IN_PROGRESS"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    private Reservation buildReservation(
            Guest reservationGuest,
            Room room,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            ReservationStatus status,
            String confirmationNumber) {
        Reservation reservation = new Reservation(
                reservationGuest,
                room,
                checkInDate,
                checkOutDate,
                new BigDecimal("250.00"),
                status,
                confirmationNumber);
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(new BigDecimal("250.00"));
        reservation.setInvoiceFinalized(false);
        return reservation;
    }

    private String writeServiceRequestPayload(Map<String, Object> request, Long roomId) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>(request);
        payload.put("roomId", roomId);
        return objectMapper.writeValueAsString(payload);
    }
}
