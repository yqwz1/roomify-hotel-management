package com.roomify.backend.integration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;

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

        private MockMvc mockMvc;

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
        private JavaMailSender javaMailSender;

        private ObjectMapper objectMapper;
        private String managerToken;
        private String staffToken;
        private String guestToken;
        private Long roomId;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                                .apply(springSecurity())
                                .build();
                objectMapper = new ObjectMapper();

                managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
                staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");
                guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");

                reservationRepository.deleteAll();
                roomRepository.deleteAll();
                roomTypeRepository.deleteAll();
                guestRepository.deleteAll();
                reset(javaMailSender);
                when(javaMailSender.createMimeMessage()).thenReturn(
                                new org.springframework.mail.javamail.JavaMailSenderImpl().createMimeMessage());

                RoomType roomType = roomTypeRepository.save(
                                new RoomType("Deluxe", new BigDecimal("200.00"), 2, "WiFi, TV", "Deluxe room"));
                Room room = new Room("101", roomType, 1, RoomStatus.AVAILABLE);
                roomId = roomRepository.save(room).getId();
        }

        @Test
        void createReservationWithValidDataReturnsCreatedAndStoresConfirmation() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(5);
                LocalDate checkOutDate = checkInDate.plusDays(3);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "CONFIRMED",
                                "John Doe",
                                "john@example.com",
                                "1234567890",
                                "ID12345",
                                "USA");

                String response = mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                                .andExpect(jsonPath("$.confirmationNumber").isNotEmpty())
                                .andExpect(jsonPath("$.roomId").value(roomId))
                                .andExpect(jsonPath("$.nights").value(3))
                                .andExpect(jsonPath("$.roomRate").value(200.00))
                                .andExpect(jsonPath("$.subtotal").value(600.00))
                                .andExpect(jsonPath("$.taxes").value(60.00))
                                .andExpect(jsonPath("$.totalPrice").value(660.00))
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                String confirmationNumber = objectMapper.readTree(response).get("confirmationNumber").asText();
                Optional<Reservation> savedReservation = reservationRepository
                                .findByConfirmationNumber(confirmationNumber);
                assertTrue(savedReservation.isPresent());
                assertEquals("CONFIRMED", savedReservation.get().getStatus().name());

                ArgumentCaptor<MimeMessage> mailCaptor = ArgumentCaptor.forClass(MimeMessage.class);
                verify(javaMailSender, times(1)).send(mailCaptor.capture());
                MimeMessage sentMail = mailCaptor.getValue();

                assertEquals("john@example.com",
                                ((InternetAddress) sentMail.getRecipients(Message.RecipientType.TO)[0]).getAddress());
                assertEquals("Reservation Confirmation", sentMail.getSubject());
        }

        @Test
        void createReservationWithExistingGuestReusesGuest() throws Exception {
                Guest existingGuest = guestRepository.save(
                                new Guest("Existing Guest", "existing@example.com", "0500000000", "ID-EX-1", "USA"));

                LocalDate checkInDate = LocalDate.now().plusDays(10);
                LocalDate checkOutDate = checkInDate.plusDays(2);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "PENDING",
                                "Existing Guest Updated",
                                "existing@example.com",
                                "0511111111",
                                "ID-EX-1",
                                "USA");

                mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + staffToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.guestId").value(existingGuest.getId()))
                                .andExpect(jsonPath("$.status").value("CONFIRMED"));

                assertEquals(1L, guestRepository.count());
        }

        @Test
        void createReservationWithInvalidDateRangeReturnsBadRequest() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(5);
                LocalDate checkOutDate = checkInDate.minusDays(1);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "PENDING",
                                "Invalid Dates",
                                "invalid@example.com",
                                "0555555555",
                                "ID-BAD-DATE",
                                "USA");

                mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.dateRangeValid")
                                                .value("Check-out date must be after check-in date"));
        }

        @Test
        void getReservationByConfirmationNumberReturnsReservation() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(7);
                LocalDate checkOutDate = checkInDate.plusDays(2);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "CONFIRMED",
                                "Lookup Guest",
                                "lookup@example.com",
                                "0500011111",
                                "ID-LOOKUP-1",
                                "USA");

                String confirmationNumber = createReservationAndGetConfirmationNumber(managerToken, request);

                mockMvc.perform(get("/api/reservations/{confirmationNumber}", confirmationNumber)
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(confirmationNumber))
                                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                                .andExpect(jsonPath("$.guestEmail").value("lookup@example.com"))
                                .andExpect(jsonPath("$.roomId").value(roomId))
                                .andExpect(jsonPath("$.nights").value(2))
                                .andExpect(jsonPath("$.subtotal").value(400.00))
                                .andExpect(jsonPath("$.taxes").value(40.00))
                                .andExpect(jsonPath("$.totalPrice").value(440.00));
        }

        @Test
        void getReservationByConfirmationNumberReturnsNotFoundForUnknownConfirmation() throws Exception {
                mockMvc.perform(get("/api/reservations/{confirmationNumber}", "RSV-UNKNOWN1234")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value(
                                                "Reservation not found with confirmation number: RSV-UNKNOWN1234"));
        }

        @Test
        void modifyReservationRouteExistsAndReturnsPlaceholderResponse() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(12);
                LocalDate checkOutDate = checkInDate.plusDays(2);

                Map<String, Object> createRequest = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "CONFIRMED",
                                "Modify Guest",
                                "modify@example.com",
                                "0500012345",
                                "ID-MODIFY-1",
                                "USA");

                Long reservationId = createReservationAndGetId(managerToken, createRequest);

                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("checkInDate", checkInDate.plusDays(1).toString());
                modifyRequest.put("checkOutDate", checkOutDate.plusDays(1).toString());
                modifyRequest.put("modificationReason", "Guest requested a one-day shift");

                mockMvc.perform(put("/api/reservations/{id}", reservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.reservationId").value(reservationId))
                                .andExpect(jsonPath("$.action").value("modify"))
                                .andExpect(jsonPath("$.placeholder").value(true));
        }

        @Test
        void cancelReservationRouteExistsAndReturnsPlaceholderResponse() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(14);
                LocalDate checkOutDate = checkInDate.plusDays(2);

                Map<String, Object> createRequest = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "PENDING",
                                "Cancel Guest",
                                "cancel@example.com",
                                "0500044444",
                                "ID-CANCEL-1",
                                "USA");

                Long reservationId = createReservationAndGetId(staffToken, createRequest);

                Map<String, Object> cancelRequest = new HashMap<>();
                cancelRequest.put("cancellationReason", "Guest changed travel plans");

                mockMvc.perform(post("/api/reservations/{id}/cancel", reservationId)
                                .header("Authorization", "Bearer " + staffToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(cancelRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.reservationId").value(reservationId))
                                .andExpect(jsonPath("$.action").value("cancel"))
                                .andExpect(jsonPath("$.currentStatus").value("CANCELLED"))
                                .andExpect(jsonPath("$.placeholder").value(true));
        }

        @Test
        void checkInWithMissingActualCheckInDateReturnsBadRequest() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED, LocalDate.now());

                mockMvc.perform(post("/api/reservations/{id}/check-in", reservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.actualCheckInDate")
                                                .value("Actual check-in date is required"));
        }

        @Test
        void checkInWithFutureActualCheckInDateReturnsBadRequest() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED, LocalDate.now());

                Map<String, Object> checkInRequest = new HashMap<>();
                checkInRequest.put("actualCheckInDate", LocalDate.now().plusDays(1).toString());

                mockMvc.perform(post("/api/reservations/{id}/check-in", reservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkInRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.actualCheckInDate")
                                                .value("Actual check-in date cannot be in the future"));
        }

        @Test
        void checkInBlockedWhenReservationIsCancelledKeepsDatabaseState() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CANCELLED, LocalDate.now());
                assertCheckInBlockedAndDatabaseUnchanged(reservationId, LocalDate.now(), status().isConflict());
        }

        @Test
        void checkInBlockedWhenReservationAlreadyCheckedInKeepsDatabaseState() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CHECKED_IN, LocalDate.now());
                assertCheckInBlockedAndDatabaseUnchanged(reservationId, LocalDate.now(), status().isConflict());
        }

        @Test
        void checkInBlockedWhenReservationAlreadyCheckedOutKeepsDatabaseState() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CHECKED_OUT, LocalDate.now());
                assertCheckInBlockedAndDatabaseUnchanged(reservationId, LocalDate.now(), status().isConflict());
        }

        @Test
        void checkInBlockedWhenActualDateBeforeScheduledCheckInDateKeepsDatabaseState() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED,
                                LocalDate.now().plusDays(5));
                assertCheckInBlockedAndDatabaseUnchanged(reservationId, LocalDate.now(), status().isConflict());
        }

        @Test
        void checkInBlockedWhenRoomNeedsCleaningKeepsDatabaseState() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED, LocalDate.now());
                Room room = roomRepository.findById(roomId).orElseThrow();
                room.setStatus(RoomStatus.NEEDS_CLEANING);
                roomRepository.save(room);

                assertCheckInBlockedAndDatabaseUnchanged(reservationId, LocalDate.now(), status().isConflict());
        }

        @Test
        void checkInBlockedWhenRoomUnderMaintenanceKeepsDatabaseState() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED, LocalDate.now());
                Room room = roomRepository.findById(roomId).orElseThrow();
                room.setStatus(RoomStatus.UNDER_MAINTENANCE);
                roomRepository.save(room);

                assertCheckInBlockedAndDatabaseUnchanged(reservationId, LocalDate.now(), status().isConflict());
        }

        @Test
        void checkInSucceedsWhenRoomIsAvailableAndUpdatesReservationAndRoom() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED, LocalDate.now());

                Map<String, Object> checkInRequest = new HashMap<>();
                LocalDate actualCheckInDate = LocalDate.now();
                checkInRequest.put("actualCheckInDate", actualCheckInDate.toString());

                mockMvc.perform(post("/api/reservations/{id}/check-in", reservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkInRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.reservationId").value(reservationId))
                                .andExpect(jsonPath("$.currentStatus").value("CHECKED_IN"));

                Reservation savedReservation = reservationRepository.findById(reservationId).orElseThrow();
                Room savedRoom = roomRepository.findById(roomId).orElseThrow();

                assertEquals(ReservationStatus.CHECKED_IN, savedReservation.getStatus());
                assertEquals(actualCheckInDate, savedReservation.getActualCheckInDate());
                assertEquals(RoomStatus.OCCUPIED, savedRoom.getStatus());
        }

        @Test
        void guestCannotCheckInReservation() throws Exception {
                Long reservationId = createReservationForCheckIn(ReservationStatus.CONFIRMED, LocalDate.now());

                Map<String, Object> checkInRequest = new HashMap<>();
                checkInRequest.put("actualCheckInDate", LocalDate.now().toString());

                mockMvc.perform(post("/api/reservations/{id}/check-in", reservationId)
                                .header("Authorization", "Bearer " + guestToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkInRequest)))
                                .andExpect(status().isForbidden());
        }

        @Test
        void modifyReservationReturnsStandardApiErrorWhenReservationMissing() throws Exception {
                Long missingReservationId = 999_999L;
                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("checkInDate", LocalDate.now().plusDays(20).toString());
                modifyRequest.put("checkOutDate", LocalDate.now().plusDays(22).toString());
                modifyRequest.put("modificationReason", "Placeholder update");

                mockMvc.perform(put("/api/reservations/{id}", missingReservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.message")
                                                .value("Reservation not found with id: " + missingReservationId))
                                .andExpect(jsonPath("$.path").value("/api/reservations/" + missingReservationId));
        }

        @Test
        void guestCannotCreateReservation() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(5);
                LocalDate checkOutDate = checkInDate.plusDays(1);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "PENDING",
                                "Unauthorized Guest",
                                "unauthorized@example.com",
                                "0550000000",
                                "ID-NO-AUTH",
                                "USA");

                mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + guestToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden());
        }

        @Test
        void guestCannotRetrieveReservationByConfirmationNumber() throws Exception {
                LocalDate checkInDate = LocalDate.now().plusDays(8);
                LocalDate checkOutDate = checkInDate.plusDays(1);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkOutDate.toString(),
                                "PENDING",
                                "Protected Guest",
                                "protected@example.com",
                                "0500003333",
                                "ID-PROTECTED-1",
                                "USA");

                String confirmationNumber = createReservationAndGetConfirmationNumber(managerToken, request);

                mockMvc.perform(get("/api/reservations/{confirmationNumber}", confirmationNumber)
                                .header("Authorization", "Bearer " + guestToken))
                                .andExpect(status().isForbidden());
        }

        private String createReservationAndGetConfirmationNumber(String token, Map<String, Object> request)
                        throws Exception {
                String response = mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                return objectMapper.readTree(response).get("confirmationNumber").asText();
        }

        private Long createReservationAndGetId(String token, Map<String, Object> request) throws Exception {
                String response = mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                return objectMapper.readTree(response).get("id").asLong();
        }

        private Long createReservationForCheckIn(ReservationStatus status, LocalDate checkInDate) throws Exception {
                Map<String, Object> createRequest = buildCreateReservationRequest(
                                roomId,
                                checkInDate.toString(),
                                checkInDate.plusDays(2).toString(),
                                ReservationStatus.CONFIRMED.name(),
                                "CheckIn Guest",
                                "checkin." + status.name().toLowerCase() + "@example.com",
                                "0500099999",
                                "ID-CHECKIN-" + status.name(),
                                "USA");

                Long reservationId = createReservationAndGetId(managerToken, createRequest);

                if (status != ReservationStatus.CONFIRMED) {
                        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow();
                        reservation.setStatus(status);
                        if (status == ReservationStatus.CHECKED_IN || status == ReservationStatus.CHECKED_OUT) {
                                reservation.setActualCheckInDate(checkInDate);
                        }
                        reservationRepository.save(reservation);
                }

                return reservationId;
        }

        private void assertCheckInBlockedAndDatabaseUnchanged(
                        Long reservationId,
                        LocalDate actualCheckInDate,
                        org.springframework.test.web.servlet.ResultMatcher expectedStatus) throws Exception {
                Reservation beforeReservation = reservationRepository.findById(reservationId).orElseThrow();
                ReservationStatus beforeReservationStatus = beforeReservation.getStatus();
                LocalDate beforeActualCheckInDate = beforeReservation.getActualCheckInDate();
                RoomStatus beforeRoomStatus = roomRepository.findById(roomId).orElseThrow().getStatus();

                Map<String, Object> checkInRequest = new HashMap<>();
                checkInRequest.put("actualCheckInDate", actualCheckInDate.toString());

                mockMvc.perform(post("/api/reservations/{id}/check-in", reservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkInRequest)))
                                .andExpect(expectedStatus);

                Reservation afterReservation = reservationRepository.findById(reservationId).orElseThrow();
                RoomStatus afterRoomStatus = roomRepository.findById(roomId).orElseThrow().getStatus();

                assertEquals(beforeReservationStatus, afterReservation.getStatus());
                assertEquals(beforeActualCheckInDate, afterReservation.getActualCheckInDate());
                assertEquals(beforeRoomStatus, afterRoomStatus);
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
}
