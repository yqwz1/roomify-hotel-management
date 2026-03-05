package com.roomify.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

                ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
                verify(javaMailSender, times(1)).send(mailCaptor.capture());
                SimpleMailMessage sentMail = mailCaptor.getValue();

                assertEquals("john@example.com", sentMail.getTo()[0]);
                assertEquals("Your Roomify reservation confirmation", sentMail.getSubject());
                assertTrue(sentMail.getText().contains("Confirmation number: " + confirmationNumber));
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
                                .andExpect(jsonPath("$.status").value("PENDING"));

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

        // ─── GET /api/reservations/search ────────────────────────────────────────

        @Test
        void searchByConfirmationReturnsFullLookupPayload() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(14);
                LocalDate checkOut = checkIn.plusDays(3);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId, checkIn.toString(), checkOut.toString(), "CONFIRMED",
                                "Alice Smith", "alice@example.com", "0500012345", "ID-ALICE-1", "UK");

                String confirmationNumber = createReservationAndGetConfirmationNumber(managerToken, request);

                mockMvc.perform(get("/api/reservations/search")
                                .param("confirmation", confirmationNumber)
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(confirmationNumber))
                                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                                // room section
                                .andExpect(jsonPath("$.room.roomNumber").value("101"))
                                .andExpect(jsonPath("$.room.roomTypeName").value("Deluxe"))
                                .andExpect(jsonPath("$.room.floor").value(1))
                                .andExpect(jsonPath("$.room.maxGuests").value(2))
                                .andExpect(jsonPath("$.room.amenities").value("WiFi, TV"))
                                // dates section
                                .andExpect(jsonPath("$.dates.checkIn").value(checkIn.toString()))
                                .andExpect(jsonPath("$.dates.checkOut").value(checkOut.toString()))
                                .andExpect(jsonPath("$.dates.nights").value(3))
                                // guest section
                                .andExpect(jsonPath("$.guest.name").value("Alice Smith"))
                                .andExpect(jsonPath("$.guest.email").value("alice@example.com"))
                                .andExpect(jsonPath("$.guest.phone").value("0500012345"))
                                .andExpect(jsonPath("$.guest.idNumber").value("ID-ALICE-1"))
                                .andExpect(jsonPath("$.guest.nationality").value("UK"))
                                // pricing section
                                .andExpect(jsonPath("$.pricing.roomRate").value(200.00))
                                .andExpect(jsonPath("$.pricing.subtotal").value(600.00))
                                .andExpect(jsonPath("$.pricing.taxes").value(60.00))
                                .andExpect(jsonPath("$.pricing.totalPrice").value(660.00));
        }

        @Test
        void searchByGuestNameReturnsReservation() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(20);
                LocalDate checkOut = checkIn.plusDays(2);

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId, checkIn.toString(), checkOut.toString(), "PENDING",
                                "Bob Marley", "bob@example.com", "0500099999", "ID-BOB-1", "Jamaica");

                createReservationAndGetConfirmationNumber(managerToken, request);

                // Partial, case-insensitive name match
                mockMvc.perform(get("/api/reservations/search")
                                .param("guestName", "bob")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.guest.name").value("Bob Marley"))
                                .andExpect(jsonPath("$.guest.nationality").value("Jamaica"))
                                .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        void searchWithBothParamsBlankReturnsBadRequest() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(
                                                "At least one search parameter is required: 'confirmation' or 'guestName'"));
        }

        @Test
        void searchByUnknownConfirmationReturnsNotFound() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .param("confirmation", "RSV-NOTEXIST0000")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value(
                                                "Reservation not found with confirmation number: RSV-NOTEXIST0000"));
        }

        @Test
        void searchByUnknownGuestNameReturnsNotFound() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .param("guestName", "Nobody Nowhere")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value(
                                                "No reservation found for guest name: Nobody Nowhere"));
        }

        @Test
        void guestRoleCannotAccessSearchEndpoint() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .param("confirmation", "RSV-ANYVALUE0000")
                                .header("Authorization", "Bearer " + guestToken))
                                .andExpect(status().isForbidden());
        }

        // ─── Helpers ─────────────────────────────────────────────────────────────

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
