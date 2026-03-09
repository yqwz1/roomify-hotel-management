package com.roomify.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.dto.EmailDeliveryStatus;
import com.roomify.backend.entity.AuditLog;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.AuditLogRepository;
import com.roomify.backend.repository.EmailLogRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reservationdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000",
        "roomify.reservations.tax-rate=0.10"
})
class ReservationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JavaMailSender javaMailSender;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String managerToken;
    private String staffToken;
    private Long room1Id;
    private Long room2Id;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");

        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();
        emailLogRepository.deleteAll();
        auditLogRepository.deleteAll();

        reset(javaMailSender);
        when(javaMailSender.createMimeMessage())
                .thenAnswer(invocation -> new MimeMessage(Session.getInstance(new Properties())));

        RoomType deluxe = roomTypeRepository.save(
                new RoomType("Deluxe", new BigDecimal("200.00"), 2, "WiFi, TV", "Deluxe room"));
        RoomType suite = roomTypeRepository.save(
                new RoomType("Suite", new BigDecimal("300.00"), 4, "WiFi, TV, Lounge", "Suite room"));

        room1Id = roomRepository.save(new Room("101", deluxe, 1, RoomStatus.AVAILABLE)).getId();
        room2Id = roomRepository.save(new Room("102", suite, 1, RoomStatus.AVAILABLE)).getId();
    }

    @Test
    void lookupThenCheckInSuccessUpdatesStatusRoomAndWritesAudit() throws Exception {
        CreatedReservation created = createReservation(
                managerToken,
                room1Id,
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                "CONFIRMED");

        mockMvc.perform(get("/api/reservations/search")
                        .header("Authorization", "Bearer " + staffToken)
                        .param("confirmation", created.confirmationNumber()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmationNumber").value(created.confirmationNumber()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.id()))
                .andExpect(jsonPath("$.status").value("CHECKED_IN"));

        Reservation updated = reservationRepository.findById(created.id()).orElseThrow();
        Room room = roomRepository.findById(room1Id).orElseThrow();

        assertEquals(ReservationStatus.CHECKED_IN, updated.getStatus());
        assertEquals(LocalDate.now(), updated.getActualCheckInDate());
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertTrue(logs.stream().anyMatch(log -> "ROOM_STATUS_CHANGE".equals(log.getAction())));
    }

    @Test
    void checkInBlockedWhenReservationIsNotConfirmed() throws Exception {
        CreatedReservation created = createReservation(
                managerToken,
                room1Id,
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                "PENDING");

        mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Only CONFIRMED reservations can be checked in"));

        Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
        Room room = roomRepository.findById(room1Id).orElseThrow();

        assertEquals(ReservationStatus.PENDING, reservation.getStatus());
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
    }

    @Test
    void checkInBlockedWhenRoomIsNotReady() throws Exception {
        CreatedReservation created = createReservation(
                managerToken,
                room1Id,
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                "CONFIRMED");

        Room room = roomRepository.findById(room1Id).orElseThrow();
        room.setStatus(RoomStatus.NEEDS_CLEANING);
        roomRepository.save(room);

        mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Room not ready"));

        Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
    }

    @Test
    void cancelFlowUpdatesStatusAndCreatesEmailLogAndAuditEntry() throws Exception {
        CreatedReservation created = createReservation(
                staffToken,
                room1Id,
                LocalDate.now().plusDays(4),
                LocalDate.now().plusDays(7),
                "CONFIRMED");

        Map<String, Object> cancelRequest = new HashMap<>();
        cancelRequest.put("cancellationReason", "  Guest changed plans  ");

        mockMvc.perform(post("/api/reservations/{id}/cancel", created.id())
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(created.id()))
                .andExpect(jsonPath("$.action").value("cancel"))
                .andExpect(jsonPath("$.currentStatus").value("CANCELLED"));

        Reservation cancelled = reservationRepository.findById(created.id()).orElseThrow();
        assertEquals(ReservationStatus.CANCELLED, cancelled.getStatus());
        assertEquals("Guest changed plans", cancelled.getCancellationReason());
        assertNotNull(cancelled.getCancellationAt());

        assertTrue(emailLogRepository.findAll().stream().anyMatch(log ->
                created.confirmationNumber().equals(log.getConfirmationNumber())
                        && "Reservation Cancelled".equals(log.getSubject())
                        && log.getStatus() == EmailDeliveryStatus.SENT));

        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(log -> "RESERVATION_CANCELLED".equals(log.getAction())));
    }

    @Test
    void cancelFlowStillSucceedsWhenEmailDeliveryFailsAndLogsFailedAttempt() throws Exception {
        CreatedReservation created = createReservation(
                managerToken,
                room1Id,
                LocalDate.now().plusDays(3),
                LocalDate.now().plusDays(5),
                "CONFIRMED");

        doThrow(new MailSendException("SMTP unavailable"))
                .when(javaMailSender)
                .send(any(MimeMessage.class));

        mockMvc.perform(post("/api/reservations/{id}/cancel", created.id())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStatus").value("CANCELLED"));

        Reservation cancelled = reservationRepository.findById(created.id()).orElseThrow();
        assertEquals(ReservationStatus.CANCELLED, cancelled.getStatus());

        assertTrue(emailLogRepository.findAll().stream().anyMatch(log ->
                created.confirmationNumber().equals(log.getConfirmationNumber())
                        && "Reservation Cancelled".equals(log.getSubject())
                        && log.getStatus() == EmailDeliveryStatus.FAILED));
    }

    @Test
    void modifyFlowRecalculatesPricePersistsReasonAndCreatesEmailLogAndAuditEntry() throws Exception {
        CreatedReservation created = createReservation(
                managerToken,
                room1Id,
                LocalDate.now().plusDays(6),
                LocalDate.now().plusDays(8),
                "CONFIRMED");

        long beforeCount = reservationRepository.count();

        Map<String, Object> modifyRequest = new HashMap<>();
        modifyRequest.put("roomId", room2Id);
        modifyRequest.put("checkInDate", LocalDate.now().plusDays(7).toString());
        modifyRequest.put("checkOutDate", LocalDate.now().plusDays(10).toString());
        modifyRequest.put("modificationReason", "  Guest requested upgrade  ");

        mockMvc.perform(put("/api/reservations/{id}", created.id())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(created.id()))
                .andExpect(jsonPath("$.action").value("modify"));

        assertEquals(beforeCount, reservationRepository.count());

        Reservation modified = reservationRepository.findById(created.id()).orElseThrow();
        assertEquals(room2Id, modified.getRoom().getId());
        assertEquals(LocalDate.now().plusDays(7), modified.getCheckInDate());
        assertEquals(LocalDate.now().plusDays(10), modified.getCheckOutDate());
        assertEquals("Guest requested upgrade", modified.getModificationReason());
        assertEquals(0, modified.getTotalPrice().compareTo(new BigDecimal("990.00")));

        assertTrue(emailLogRepository.findAll().stream().anyMatch(log ->
                created.confirmationNumber().equals(log.getConfirmationNumber())
                        && "Reservation Modified".equals(log.getSubject())
                        && log.getStatus() == EmailDeliveryStatus.SENT));

        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(log -> "RESERVATION_MODIFIED".equals(log.getAction())));
    }

    @Test
    void modifyFlowReturnsConflictOnAvailabilityOverlapWithClearMessage() throws Exception {
        CreatedReservation first = createReservation(
                managerToken,
                room2Id,
                LocalDate.now().plusDays(20),
                LocalDate.now().plusDays(23),
                "CONFIRMED");
        CreatedReservation second = createReservation(
                managerToken,
                room2Id,
                LocalDate.now().plusDays(25),
                LocalDate.now().plusDays(27),
                "CONFIRMED");

        Map<String, Object> modifyRequest = new HashMap<>();
        modifyRequest.put("roomId", room2Id);
        modifyRequest.put("checkInDate", LocalDate.now().plusDays(21).toString());
        modifyRequest.put("checkOutDate", LocalDate.now().plusDays(26).toString());

        mockMvc.perform(put("/api/reservations/{id}", second.id())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modifyRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Selected room is not available for the requested dates"))
                .andExpect(jsonPath("$.path").value("/api/reservations/" + second.id()));

        Reservation unchanged = reservationRepository.findById(second.id()).orElseThrow();
        assertEquals(LocalDate.now().plusDays(25), unchanged.getCheckInDate());
        assertEquals(LocalDate.now().plusDays(27), unchanged.getCheckOutDate());
        assertEquals(first.id(), reservationRepository.findById(first.id()).orElseThrow().getId());
    }

    @Test
    void notFoundErrorsReturnConsistentPayload() throws Exception {
        long missingId = 999_999L;

        Map<String, Object> modifyRequest = new HashMap<>();
        modifyRequest.put("checkInDate", LocalDate.now().plusDays(5).toString());
        modifyRequest.put("checkOutDate", LocalDate.now().plusDays(7).toString());

        mockMvc.perform(put("/api/reservations/{id}", missingId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modifyRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Reservation not found with id: " + missingId))
                .andExpect(jsonPath("$.path").value("/api/reservations/" + missingId));

        String unknownConfirmation = "RSV-UNKNOWN-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        mockMvc.perform(get("/api/reservations/{confirmationNumber}", unknownConfirmation)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message")
                        .value("Reservation not found with confirmation number: " + unknownConfirmation))
                .andExpect(jsonPath("$.path").value("/api/reservations/" + unknownConfirmation));
    }

    private CreatedReservation createReservation(
            String token,
            Long roomId,
            LocalDate checkIn,
            LocalDate checkOut,
            String status) throws Exception {

        Map<String, Object> request = buildCreateReservationRequest(
                roomId,
                checkIn.toString(),
                checkOut.toString(),
                status,
                "Guest " + UUID.randomUUID().toString().substring(0, 6),
                "guest." + UUID.randomUUID().toString().substring(0, 8) + "@example.com",
                "0500000000",
                "ID-" + UUID.randomUUID().toString().substring(0, 8),
                "USA");

        String response = mockMvc.perform(post("/api/reservations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return new CreatedReservation(json.get("id").asLong(), json.get("confirmationNumber").asText());
    }

    private Map<String, Object> buildCreateReservationRequest(
            Long roomId,
            String checkInDate,
            String checkOutDate,
            String status,
            String guestName,
            String guestEmail,
            String guestPhone,
            String guestIdNumber,
            String guestNationality) {

        Map<String, Object> guest = new HashMap<>();
        guest.put("name", guestName);
        guest.put("email", guestEmail);
        guest.put("phone", guestPhone);
        guest.put("idNumber", guestIdNumber);
        guest.put("nationality", guestNationality);

        Map<String, Object> request = new HashMap<>();
        request.put("roomId", roomId);
        request.put("checkInDate", checkInDate);
        request.put("checkOutDate", checkOutDate);
        request.put("status", status);
        request.put("guest", guest);
        return request;
    }

    private record CreatedReservation(Long id, String confirmationNumber) {
    }
}
