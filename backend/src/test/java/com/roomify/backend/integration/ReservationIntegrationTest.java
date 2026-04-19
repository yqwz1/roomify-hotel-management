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
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.AuditLogRepository;
import com.roomify.backend.repository.EmailLogRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.PaymentRepository;
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
                "roomify.billing.vat-rate=0.15"
})
class ReservationIntegrationTest {

        @Autowired
        private WebApplicationContext webApplicationContext;

        @Autowired
        private JwtUtils jwtUtils;

        @Autowired
        private ReservationRepository reservationRepository;

        @Autowired
        private PaymentRepository paymentRepository;

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
        private String guestToken;
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
                guestToken = jwtUtils.generateToken("guest@roomify.com", "ROLE_GUEST");

                paymentRepository.deleteAll();
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
        void getAllReservationsAppliesGuestNameFilterAndReturnsAllMatches() throws Exception {
                CreatedReservation earlierJane = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(3),
                                LocalDate.now().plusDays(5),
                                "CONFIRMED",
                                "Jane Doe");
                CreatedReservation laterJane = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(10),
                                LocalDate.now().plusDays(12),
                                "CONFIRMED",
                                "Jane Doe");
                createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(15),
                                LocalDate.now().plusDays(17),
                                "CONFIRMED",
                                "John Example");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("guestName", "Jane"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(2, json.size());
                assertEquals(laterJane.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals(earlierJane.confirmationNumber(), json.get(1).get("confirmationNumber").asText());
                assertEquals("Jane Doe", json.get(0).get("guestName").asText());
                assertEquals("Jane Doe", json.get(1).get("guestName").asText());
        }

        @Test
        void lookupByGuestNameReturnsSingleReservationWhenMatchIsUnique() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(4),
                                LocalDate.now().plusDays(6),
                                "CONFIRMED",
                                "Unique Guest");

                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("guestName", "Unique"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(created.confirmationNumber()))
                                .andExpect(jsonPath("$.guest.name").value("Unique Guest"))
                                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        }

        @Test
        void lookupByGuestNameReturnsConflictWhenMultipleReservationsMatch() throws Exception {
                createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(3),
                                LocalDate.now().plusDays(5),
                                "CONFIRMED",
                                "Jane Doe");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(10),
                                LocalDate.now().plusDays(12),
                                "CONFIRMED",
                                "Jane Doe");

                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("guestName", "Jane"))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.message").value(
                                                "Multiple reservations found for guest name: Jane. Use the reservation list filters or a confirmation number to select the exact stay."));
        }

        @Test
        void getAllReservationsAppliesStatusAndDateFilters() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(20),
                                LocalDate.now().plusDays(22),
                                "CONFIRMED",
                                "Status Match");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(20),
                                LocalDate.now().plusDays(22),
                                "PENDING",
                                "Pending Same Dates");
                createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(24),
                                LocalDate.now().plusDays(26),
                                "CONFIRMED",
                                "Confirmed Other Dates");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("status", "CONFIRMED")
                                .param("checkInDate", LocalDate.now().plusDays(20).toString())
                                .param("checkOutDate", LocalDate.now().plusDays(22).toString()))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(target.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("CONFIRMED", json.get(0).get("status").asText());
        }

        @Test
        void getAllReservationsAppliesCombinedFilters() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(30),
                                LocalDate.now().plusDays(32),
                                "CONFIRMED",
                                "Jane Combined");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(30),
                                LocalDate.now().plusDays(32),
                                "CONFIRMED",
                                "John Combined");
                createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(34),
                                LocalDate.now().plusDays(36),
                                "CONFIRMED",
                                "Jane Combined");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("guestName", "Jane")
                                .param("status", "CONFIRMED")
                                .param("checkInDate", LocalDate.now().plusDays(30).toString())
                                .param("checkOutDate", LocalDate.now().plusDays(32).toString()))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(target.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("Jane Combined", json.get(0).get("guestName").asText());
        }

        @Test
        void getAllReservationsMatchesGuestNameTokensCaseInsensitively() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(33),
                                LocalDate.now().plusDays(35),
                                "CONFIRMED",
                                "Jane Mary Doe");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(33),
                                LocalDate.now().plusDays(35),
                                "CONFIRMED",
                                "Jane Smith");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("guestName", "  DOE   jane  "))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(target.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("Jane Mary Doe", json.get(0).get("guestName").asText());
        }

        @Test
        void getAllReservationsAppliesQueueTabArrivalsAsConfirmedFilter() throws Exception {
                CreatedReservation confirmed = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(7),
                                LocalDate.now().plusDays(9),
                                "CONFIRMED",
                                "Queue Confirmed");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(7),
                                LocalDate.now().plusDays(9),
                                "PENDING",
                                "Queue Pending");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "arrivals"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(confirmed.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("CONFIRMED", json.get(0).get("status").asText());
        }

        @Test
        void getAllReservationsAppliesQueueTabInHouseAsCheckedInFilter() throws Exception {
                CreatedReservation inHouse = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Queue In House");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(1),
                                LocalDate.now().plusDays(3),
                                "CONFIRMED",
                                "Queue Not In House");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", inHouse.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "in_house"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(inHouse.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("CHECKED_IN", json.get(0).get("status").asText());
        }

        @Test
        void getAllReservationsAppliesQueueTabDeparturesAsCheckedInFilter() throws Exception {
                CreatedReservation departure = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(1),
                                "CONFIRMED",
                                "Queue Departure");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(2),
                                LocalDate.now().plusDays(4),
                                "CONFIRMED",
                                "Queue Upcoming");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", departure.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "departures"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(departure.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("CHECKED_IN", json.get(0).get("status").asText());
        }

        @Test
        void arrivalsQueueUsesCheckInDateToScopeArrivalDay() throws Exception {
                LocalDate arrivalDay = LocalDate.now().plusDays(12);
                CreatedReservation arrivingToday = createReservation(
                                managerToken,
                                room1Id,
                                arrivalDay,
                                arrivalDay.plusDays(2),
                                "CONFIRMED",
                                "Arrivals Day Match");
                createReservation(
                                managerToken,
                                room2Id,
                                arrivalDay.plusDays(1),
                                arrivalDay.plusDays(3),
                                "CONFIRMED",
                                "Arrivals Other Day");

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "arrivals")
                                .param("checkInDate", arrivalDay.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(arrivingToday.confirmationNumber()))
                                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
        }

        @Test
        void departuresQueueUsesCheckOutDateToScopeDepartureDay() throws Exception {
                LocalDate departureDay = LocalDate.now().plusDays(3);
                CreatedReservation departingToday = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                departureDay,
                                "CONFIRMED",
                                "Departures Day Match");
                CreatedReservation departingLater = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now(),
                                departureDay.plusDays(1),
                                "CONFIRMED",
                                "Departures Other Day");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", departingToday.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());
                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", departingLater.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "departures")
                                .param("checkOutDate", departureDay.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(departingToday.confirmationNumber()))
                                .andExpect(jsonPath("$[0].status").value("CHECKED_IN"));
        }

        @Test
        void getAllReservationsAppliesQueueTabTogetherWithGuestNameFilter() throws Exception {
                CreatedReservation matching = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Queue Guest Match");
                CreatedReservation sameTabDifferentGuest = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Queue Other Guest");
                createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(5),
                                LocalDate.now().plusDays(7),
                                "CONFIRMED",
                                "Queue Guest Match");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", matching.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());
                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", sameTabDifferentGuest.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "in_house")
                                .param("guestName", "Match"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(matching.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("Queue Guest Match", json.get(0).get("guestName").asText());
                assertEquals("CHECKED_IN", json.get(0).get("status").asText());
        }

        @Test
        void staffCanApplyQueueTabGuestNameAndDateFiltersTogether() throws Exception {
                LocalDate checkIn = LocalDate.now();
                LocalDate checkOut = LocalDate.now().plusDays(2);

                CreatedReservation matching = createReservation(
                                managerToken,
                                room1Id,
                                checkIn,
                                checkOut,
                                "CONFIRMED",
                                "Staff Queue Match");
                CreatedReservation sameQueueDifferentDate = createReservation(
                                managerToken,
                                room2Id,
                                checkIn,
                                checkOut.plusDays(1),
                                "CONFIRMED",
                                "Staff Queue Match");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", matching.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());
                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}",
                                sameQueueDifferentDate.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("queueTab", "in_house")
                                .param("guestName", "match")
                                .param("checkOutDate", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(matching.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("CHECKED_IN", json.get(0).get("status").asText());
        }

        @Test
        void getAllReservationsUsesExplicitStatusOverQueueTabForStaffRequests() throws Exception {
                CreatedReservation confirmed = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(11),
                                LocalDate.now().plusDays(13),
                                "CONFIRMED",
                                "Status Priority");
                CreatedReservation checkedIn = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Status Priority");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", checkedIn.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("queueTab", "in_house")
                                .param("status", "CONFIRMED")
                                .param("guestName", "Priority"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(confirmed.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("CONFIRMED", json.get(0).get("status").asText());
        }

        @Test
        void getAllReservationsIgnoresUnsupportedQueueTabAndPreservesLegacyListBehavior() throws Exception {
                CreatedReservation first = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(2),
                                LocalDate.now().plusDays(4),
                                "CONFIRMED",
                                "Unsupported Queue One");
                CreatedReservation second = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "PENDING",
                                "Unsupported Queue Two");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "frontDeskUnknown"))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                List<String> confirmations = json.findValuesAsText("confirmationNumber");

                assertEquals(2, json.size());
                assertTrue(confirmations.contains(first.confirmationNumber()));
                assertTrue(confirmations.contains(second.confirmationNumber()));
        }

        @Test
        void getAllReservationsWithoutFiltersReturnsUnfilteredList() throws Exception {
                CreatedReservation first = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(2),
                                LocalDate.now().plusDays(4),
                                "CONFIRMED",
                                "Unfiltered One");
                CreatedReservation second = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "PENDING",
                                "Unfiltered Two");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                List<String> confirmations = json.findValuesAsText("confirmationNumber");

                assertEquals(2, json.size());
                assertTrue(confirmations.contains(first.confirmationNumber()));
                assertTrue(confirmations.contains(second.confirmationNumber()));
                assertTrue(json.get(0).has("confirmationNumber"));
                assertTrue(json.get(0).has("guestName"));
                assertTrue(json.get(0).has("checkInDate"));
                assertTrue(json.get(0).has("checkOutDate"));
                assertTrue(json.get(0).has("status"));
        }

        @Test
        void getAllReservationsAppliesConfirmationFilterCaseInsensitively() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(11),
                                LocalDate.now().plusDays(13),
                                "CONFIRMED",
                                "Confirmation Target");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(11),
                                LocalDate.now().plusDays(13),
                                "CONFIRMED",
                                "Confirmation Other");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("confirmation", " " + target.confirmationNumber().toLowerCase() + " "))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(target.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("Confirmation Target", json.get(0).get("guestName").asText());
        }

        @Test
        void getAllReservationsAcceptsConfirmationNumberAliasAndIgnoresConflictingFilters() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(14),
                                LocalDate.now().plusDays(16),
                                "CONFIRMED",
                                "Confirmation Alias Guest");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(14),
                                LocalDate.now().plusDays(16),
                                "PENDING",
                                "Other Guest");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("confirmationNumber", " " + target.confirmationNumber().toLowerCase() + " ")
                                .param("guestName", "No Match")
                                .param("status", "PENDING")
                                .param("queueTab", "in_house")
                                .param("checkInDate", LocalDate.now().plusDays(99).toString())
                                .param("checkOutDate", LocalDate.now().plusDays(100).toString()))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(target.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("Confirmation Alias Guest", json.get(0).get("guestName").asText());
                assertEquals("CONFIRMED", json.get(0).get("status").asText());
        }

        @Test
        void getAllReservationsPrefersConfirmationOverConfirmationNumberAliasWhenBothProvided() throws Exception {
                CreatedReservation confirmationTarget = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(17),
                                LocalDate.now().plusDays(19),
                                "CONFIRMED",
                                "Primary Confirmation");
                CreatedReservation aliasTarget = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(17),
                                LocalDate.now().plusDays(19),
                                "CONFIRMED",
                                "Alias Confirmation");

                String response = mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("confirmation", confirmationTarget.confirmationNumber())
                                .param("confirmationNumber", aliasTarget.confirmationNumber()))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(confirmationTarget.confirmationNumber(), json.get(0).get("confirmationNumber").asText());
                assertEquals("Primary Confirmation", json.get(0).get("guestName").asText());
        }

        @Test
        void searchAcceptsConfirmationNumberAlias() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(18),
                                LocalDate.now().plusDays(20),
                                "CONFIRMED",
                                "Alias Lookup");

                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("confirmationNumber", " " + created.confirmationNumber().toLowerCase() + " "))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(created.confirmationNumber()))
                                .andExpect(jsonPath("$.guest.name").value("Alias Lookup"))
                                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        }

        @Test
        void searchPrefersConfirmationOverGuestNameWhenBothProvided() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(21),
                                LocalDate.now().plusDays(23),
                                "CONFIRMED",
                                "Lookup Priority");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(21),
                                LocalDate.now().plusDays(23),
                                "CONFIRMED",
                                "Lookup Priority");

                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("confirmation", " " + target.confirmationNumber().toLowerCase() + " ")
                                .param("guestName", "Lookup"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(target.confirmationNumber()))
                                .andExpect(jsonPath("$.guest.name").value("Lookup Priority"));
        }

        @Test
        void searchWithoutConfirmationOrGuestNameReturnsBadRequest() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"))
                                .andExpect(jsonPath("$.message").value(
                                                "At least one search parameter is required: 'confirmation' or 'guestName'"));
        }

        @Test
        void getAllReservationsReturnsBadRequestForInvalidStatusFilter() throws Exception {
                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("status", "NOT_A_STATUS"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.status")
                                                .value("Invalid value for parameter: status (NOT_A_STATUS)"));
        }

        @Test
        void getAllReservationsReturnsBadRequestForInvalidDateFilter() throws Exception {
                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("checkInDate", "2026-99-99"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.checkInDate")
                                                .value("Invalid value for parameter: checkInDate (2026-99-99)"));
        }

        @Test
        void getAllReservationsNormalizesStatusFilterCaseAndLegacyAliases() throws Exception {
                CreatedReservation confirmed = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(31),
                                LocalDate.now().plusDays(33),
                                "CONFIRMED",
                                "Normalized Confirmed");
                CreatedReservation checkedIn = createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Normalized Checked In");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", checkedIn.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("status", " confirmed "))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(confirmed.confirmationNumber()));

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("status", " checked-in "))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(checkedIn.confirmationNumber()));
        }

        @Test
        void getAllReservationsNormalizesQueueTabVariants() throws Exception {
                CreatedReservation checkedIn = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Queue Variant");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", checkedIn.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", " in-house "))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(checkedIn.confirmationNumber()));

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("queueTab", "IN_HOUSE"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(checkedIn.confirmationNumber()));
        }

        @Test
        void getAllReservationsAppliesSingleDateFiltersIndependently() throws Exception {
                LocalDate targetCheckIn = LocalDate.now().plusDays(40);
                LocalDate targetCheckOut = LocalDate.now().plusDays(42);

                CreatedReservation checkInMatch = createReservation(
                                managerToken,
                                room1Id,
                                targetCheckIn,
                                targetCheckOut,
                                "CONFIRMED",
                                "CheckIn Match");
                CreatedReservation checkOutMatch = createReservation(
                                managerToken,
                                room2Id,
                                targetCheckIn.plusDays(1),
                                targetCheckOut,
                                "CONFIRMED",
                                "CheckOut Match");

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("checkInDate", targetCheckIn.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(checkInMatch.confirmationNumber()));

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("checkOutDate", targetCheckOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        void getAllReservationsTreatsBlankDateFiltersAsMissing() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(45),
                                LocalDate.now().plusDays(47),
                                "CONFIRMED",
                                "Blank Date Guest");
                createReservation(
                                managerToken,
                                room2Id,
                                LocalDate.now().plusDays(48),
                                LocalDate.now().plusDays(50),
                                "CONFIRMED",
                                "Other Guest");

                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("guestName", "Blank")
                                .param("checkInDate", "   ")
                                .param("checkOutDate", ""))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].confirmationNumber").value(target.confirmationNumber()));
        }

        @Test
        void getAllReservationsRejectsReversedDateRange() throws Exception {
                mockMvc.perform(get("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .param("checkInDate", "2026-05-10")
                                .param("checkOutDate", "2026-05-09"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"))
                                .andExpect(jsonPath("$.message").value("checkOutDate cannot be before checkInDate"));
        }

        @Test
        void searchTreatsBlankParametersAsMissing() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("confirmation", "   ")
                                .param("guestName", " "))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"))
                                .andExpect(jsonPath("$.message").value(
                                                "At least one search parameter is required: 'confirmation' or 'guestName'"));
        }

        @Test
        void searchReturnsNotFoundPayloadForUnknownConfirmation() throws Exception {
                mockMvc.perform(get("/api/reservations/search")
                                .header("Authorization", "Bearer " + staffToken)
                                .param("confirmation", " rsv-missing-001 "))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.message")
                                                .value("Reservation not found with confirmation number:  rsv-missing-001 "));
        }

        @Test
        void getByConfirmationNumberNormalizesCaseAndWhitespace() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(24),
                                LocalDate.now().plusDays(26),
                                "CONFIRMED",
                                "Detail Guest");

                mockMvc.perform(get("/api/reservations/{confirmationNumber}", " " + created.confirmationNumber().toLowerCase() + " ")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(created.confirmationNumber()))
                                .andExpect(jsonPath("$.guestName").value("Detail Guest"))
                                .andExpect(jsonPath("$.checkInDate").exists())
                                .andExpect(jsonPath("$.checkOutDate").exists())
                                .andExpect(jsonPath("$.roomNumber").exists());
        }

        @Test
        void checkInNormalizesCaseAndWhitespaceInPath() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Check In Normalize");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}",
                                " " + created.confirmationNumber().toLowerCase() + " ")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.confirmationNumber").value(created.confirmationNumber()))
                                .andExpect(jsonPath("$.status").value("CHECKED_IN"));
        }

        @Test
        void checkOutNormalizesCaseAndWhitespaceInPath() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED",
                                "Check Out Normalize");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setInvoiceFinalized(true);
                reservation.setOutstandingBalance(BigDecimal.ZERO);
                reservation.setTotalPaid(reservation.getTotalPrice());
                reservationRepository.save(reservation);

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}",
                                " " + created.confirmationNumber().toLowerCase() + " ")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.action").value("check-out"))
                                .andExpect(jsonPath("$.currentStatus").value("CHECKED_OUT"));
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
                                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                                .andExpect(jsonPath("$.actualCheckInDate").value(LocalDate.now().toString()));

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
                                .andExpect(jsonPath("$.message")
                                                .value("Only CONFIRMED reservations can be checked in"));

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
        void checkOutSuccessWhenInvoiceFinalizedAndOutstandingZero() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setInvoiceFinalized(true);
                reservation.setOutstandingBalance(BigDecimal.ZERO);
                reservation.setTotalPaid(reservation.getTotalPrice());
                reservationRepository.save(reservation);

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.action").value("check-out"))
                                .andExpect(jsonPath("$.currentStatus").value("CHECKED_OUT"))
                                .andExpect(jsonPath("$.invoiceFinalized").value(true))
                                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                                .andExpect(jsonPath("$.outstandingBalance").value(0.00));

                Reservation checkedOut = reservationRepository.findById(created.id()).orElseThrow();
                Room room = roomRepository.findById(room1Id).orElseThrow();

                assertEquals(ReservationStatus.CHECKED_OUT, checkedOut.getStatus());
                assertNotNull(checkedOut.getActualCheckOutAt());
                assertEquals(RoomStatus.NEEDS_CLEANING, room.getStatus());
        }

        @Test
        void checkOutBlockedWhenReservationIsNotCheckedIn() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.message")
                                                .value("Only CHECKED_IN reservations can be checked out"));
        }

        @Test
        void checkOutBlockedWhenOutstandingBalanceIsPositive() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setInvoiceFinalized(true);
                reservation.setOutstandingBalance(new BigDecimal("10.00"));
                reservation.setTotalPaid(reservation.getTotalPrice().subtract(new BigDecimal("10.00")));
                reservation.setPaymentStatus(com.roomify.backend.entity.PaymentStatus.PARTIALLY_PAID);
                reservationRepository.save(reservation);

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.error").value("Payment Required"))
                                .andExpect(jsonPath("$.code").value("PAYMENT_BALANCE_DUE"))
                                .andExpect(jsonPath("$.details.paymentStatus").value("PARTIALLY_PAID"))
                                .andExpect(jsonPath("$.message")
                                                .value("Outstanding balance must be 0.00 before checkout. Current outstanding: 10.00"));
        }

        @Test
        void checkOutBlockedWhenInvoiceIsNotFinalized() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setInvoiceFinalized(false);
                reservation.setOutstandingBalance(BigDecimal.ZERO);
                reservationRepository.save(reservation);

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.error").value("Payment Required"))
                                .andExpect(jsonPath("$.code").value("PAYMENT_NOT_FINALIZED"))
                                .andExpect(jsonPath("$.details.paymentStatus").value("UNPAID"))
                                .andExpect(jsonPath("$.message").value("Payment must be finalized before checkout"));
        }

        @Test
        void checkOutIsIdempotentWhenAlreadyCheckedOut() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk());

                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setInvoiceFinalized(true);
                reservation.setOutstandingBalance(BigDecimal.ZERO);
                reservation.setTotalPaid(reservation.getTotalPrice());
                reservationRepository.save(reservation);

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Checkout completed successfully"));

                Reservation firstCheckout = reservationRepository.findById(created.id()).orElseThrow();
                assertNotNull(firstCheckout.getActualCheckOutAt());

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Checkout already completed"))
                                .andExpect(jsonPath("$.currentStatus").value("CHECKED_OUT"));

                Reservation secondCheckout = reservationRepository.findById(created.id()).orElseThrow();
                assertEquals(firstCheckout.getActualCheckOutAt(), secondCheckout.getActualCheckOutAt());
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

                assertTrue(emailLogRepository.findAll().stream()
                                .anyMatch(log -> created.confirmationNumber().equals(log.getConfirmationNumber())
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

                assertTrue(emailLogRepository.findAll().stream()
                                .anyMatch(log -> created.confirmationNumber().equals(log.getConfirmationNumber())
                                                && "Reservation Cancelled".equals(log.getSubject())
                                                && log.getStatus() == EmailDeliveryStatus.FAILED));
        }

        @Test
        void createReservationValidationRejectsInvalidInitialStatus() throws Exception {
                Map<String, Object> request = buildCreateReservationRequest(
                                room1Id,
                                LocalDate.now().plusDays(6).toString(),
                                LocalDate.now().plusDays(8).toString(),
                                "CHECKED_OUT",
                                "Guest " + UUID.randomUUID().toString().substring(0, 6),
                                "guest." + UUID.randomUUID().toString().substring(0, 8) + "@example.com",
                                "0500000000",
                                "ID-" + UUID.randomUUID().toString().substring(0, 8),
                                "USA");

                mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.initialStatusValid")
                                                .value("Reservation status must be PENDING or CONFIRMED"));
        }

        @Test
        void modifyReservationValidationRejectsMissingReason() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error").value("Validation Error"))
                                .andExpect(jsonPath("$.validationErrors.modificationReason")
                                                .value("Modification reason is required"));
        }

        @Test
        void modifyReservationValidationRejectsNullReason() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"modificationReason\":null}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.validationErrors.modificationReason")
                                                .value("Modification reason is required"));
        }

        @Test
        void modifyReservationValidationRejectsBlankReason() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"modificationReason\":\"   \"}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.validationErrors.modificationReason")
                                                .value("Modification reason is required"));
        }

        @Test
        void modifyReservationValidationRejectsReasonLongerThan500() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("modificationReason", "a".repeat(501));

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.validationErrors.modificationReason")
                                                .value("Modification reason cannot exceed 500 characters"));
        }

        @Test
        void modifyReservationValidationRejectsPastCheckInDate() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("checkInDate", LocalDate.now().minusDays(1).toString());
                modifyRequest.put("modificationReason", "Shift dates");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.validationErrors.checkInDate")
                                                .value("Check-in date must be today or in the future"));
        }

        @Test
        void modifyReservationValidationRejectsTodayCheckOutDate() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("checkOutDate", LocalDate.now().toString());
                modifyRequest.put("modificationReason", "Shift dates");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.validationErrors.checkOutDate")
                                                .value("Check-out date must be in the future"));
        }

        @Test
        void modifyReservationValidationRejectsInvalidDateRange() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("checkInDate", LocalDate.now().plusDays(10).toString());
                modifyRequest.put("checkOutDate", LocalDate.now().plusDays(10).toString());
                modifyRequest.put("modificationReason", "Shift dates");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.validationErrors.dateRangeValid")
                                                .value("Check-out date must be after check-in date"));
        }

        @Test
        void modifyReservationBlockedWhenStatusCancelledAndDatabaseUnchanged() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");
                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setStatus(ReservationStatus.CANCELLED);
                reservationRepository.save(reservation);

                assertModifyBlockedAndDatabaseUnchanged(created.id(), buildModifyRequest(room2Id,
                                LocalDate.now().plusDays(7), LocalDate.now().plusDays(9), "Attempt after cancel"));
        }

        @Test
        void modifyReservationBlockedWhenStatusCheckedInAndDatabaseUnchanged() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");
                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setStatus(ReservationStatus.CHECKED_IN);
                reservation.setActualCheckInDate(LocalDate.now());
                reservationRepository.save(reservation);

                assertModifyBlockedAndDatabaseUnchanged(created.id(), buildModifyRequest(room2Id,
                                LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Attempt after check in"));
        }

        @Test
        void modifyReservationBlockedWhenStatusCheckedOutAndDatabaseUnchanged() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");
                Reservation reservation = reservationRepository.findById(created.id()).orElseThrow();
                reservation.setStatus(ReservationStatus.CHECKED_OUT);
                reservation.setActualCheckInDate(LocalDate.now());
                reservationRepository.save(reservation);

                assertModifyBlockedAndDatabaseUnchanged(created.id(), buildModifyRequest(room2Id,
                                LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Attempt after check out"));
        }

        @Test
        void modifyReservationReturnsConflictOnAvailabilityOverlapAndKeepsDatabaseState() throws Exception {
                CreatedReservation target = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(25),
                                LocalDate.now().plusDays(27),
                                "CONFIRMED");
                createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(21),
                                LocalDate.now().plusDays(24),
                                "CONFIRMED");

                Reservation before = reservationRepository.findById(target.id()).orElseThrow();

                Map<String, Object> modifyRequest = buildModifyRequest(
                                room1Id,
                                LocalDate.now().plusDays(21),
                                LocalDate.now().plusDays(23),
                                "Overlap attempt");

                mockMvc.perform(put("/api/reservations/{id}", target.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.error").value("Conflict"))
                                .andExpect(jsonPath("$.message")
                                                .value("Selected room is not available for the requested dates"));

                Reservation after = reservationRepository.findById(target.id()).orElseThrow();
                assertEquals(before.getRoom().getId(), after.getRoom().getId());
                assertEquals(before.getCheckInDate(), after.getCheckInDate());
                assertEquals(before.getCheckOutDate(), after.getCheckOutDate());
        }

        @Test
        void modifyReservationSucceedsWhenUpdatingDatesOnly() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = buildModifyRequest(
                                null,
                                LocalDate.now().plusDays(7),
                                LocalDate.now().plusDays(10),
                                "Guest shifted dates");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isOk());

                Reservation modified = reservationRepository.findById(created.id()).orElseThrow();
                assertEquals(room1Id, modified.getRoom().getId());
                assertEquals(LocalDate.now().plusDays(7), modified.getCheckInDate());
                assertEquals(LocalDate.now().plusDays(10), modified.getCheckOutDate());
                assertEquals(0, modified.getTotalPrice().compareTo(new BigDecimal("690.00")));
        }

        @Test
        void modifyReservationSucceedsWhenUpdatingRoomOnly() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = buildModifyRequest(
                                room2Id,
                                null,
                                null,
                                "Guest requested room change");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isOk());

                Reservation modified = reservationRepository.findById(created.id()).orElseThrow();
                assertEquals(room2Id, modified.getRoom().getId());
                assertEquals(LocalDate.now().plusDays(6), modified.getCheckInDate());
                assertEquals(LocalDate.now().plusDays(8), modified.getCheckOutDate());
                assertEquals(0, modified.getTotalPrice().compareTo(new BigDecimal("690.00")));
        }

        @Test
        void modifyReservationSucceedsWhenUpdatingDatesAndRoom() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = buildModifyRequest(
                                room2Id,
                                LocalDate.now().plusDays(7),
                                LocalDate.now().plusDays(10),
                                "Guest requested upgrade");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isOk());

                Reservation modified = reservationRepository.findById(created.id()).orElseThrow();
                assertEquals(room2Id, modified.getRoom().getId());
                assertEquals(LocalDate.now().plusDays(7), modified.getCheckInDate());
                assertEquals(LocalDate.now().plusDays(10), modified.getCheckOutDate());
                assertEquals("Guest requested upgrade", modified.getModificationReason());
                assertEquals(0, modified.getTotalPrice().compareTo(new BigDecimal("1035.00")));
        }

        @Test
        void modifyReservationStillSucceedsWhenEmailDeliveryFails() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                doThrow(new MailSendException("SMTP unavailable"))
                                .when(javaMailSender)
                                .send(any(MimeMessage.class));

                Map<String, Object> modifyRequest = buildModifyRequest(
                                room2Id,
                                LocalDate.now().plusDays(7),
                                LocalDate.now().plusDays(10),
                                "Email should not block");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isOk());

                Reservation modified = reservationRepository.findById(created.id()).orElseThrow();
                assertEquals(room2Id, modified.getRoom().getId());
                assertEquals(LocalDate.now().plusDays(7), modified.getCheckInDate());
                assertEquals(LocalDate.now().plusDays(10), modified.getCheckOutDate());

                assertTrue(emailLogRepository.findAll().stream()
                                .anyMatch(log -> created.confirmationNumber().equals(log.getConfirmationNumber())
                                                && "Reservation Modified".equals(log.getSubject())
                                                && log.getStatus() == EmailDeliveryStatus.FAILED));
        }

        @Test
        void guestCanReadOnlyTheirOwnReservations() throws Exception {
                guestRepository.saveAndFlush(new Guest(
                                "Guest Dashboard",
                                "guest@roomify.com",
                                "0500000000",
                                "ID-GUEST-DASHBOARD",
                                "SA"));
                Guest guest = guestRepository.findByEmailIgnoreCase("guest@roomify.com").orElseThrow();
                Guest otherGuest = guestRepository.saveAndFlush(new Guest(
                                "Other Guest",
                                "other." + UUID.randomUUID().toString().substring(0, 8) + "@example.com",
                                "0500000001",
                                "ID-OTHER-" + UUID.randomUUID().toString().substring(0, 8),
                                "SA"));

                Room room1 = roomRepository.findById(room1Id).orElseThrow();
                Room room2 = roomRepository.findById(room2Id).orElseThrow();

                Reservation ownReservation = reservationRepository.saveAndFlush(new Reservation(
                                guest,
                                room1,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                new BigDecimal("460.00"),
                                ReservationStatus.CONFIRMED,
                                "RSV-GUEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()));
                reservationRepository.saveAndFlush(new Reservation(
                                otherGuest,
                                room2,
                                LocalDate.now().plusDays(9),
                                LocalDate.now().plusDays(11),
                                new BigDecimal("690.00"),
                                ReservationStatus.CONFIRMED,
                                "RSV-OTHER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()));

                assertEquals(1, reservationRepository.findByGuest_Id(guest.getId()).size());

                String response = mockMvc.perform(get("/api/guest/reservations")
                                .header("Authorization", "Bearer " + guestToken))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JsonNode json = objectMapper.readTree(response);
                assertEquals(1, json.size());
                assertEquals(ownReservation.getConfirmationNumber(), json.get(0).path("confirmation").asText());
                assertEquals(ownReservation.getConfirmationNumber(), json.get(0).path("confirmationNumber").asText());
                assertEquals("CONFIRMED", json.get(0).path("status").asText());
        }

        @Test
        void onlyGuestsCanAccessGuestReservationEndpoint() throws Exception {
                mockMvc.perform(get("/api/guest/reservations")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isForbidden());

                mockMvc.perform(get("/api/guest/reservations")
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isForbidden());
        }

        @Test
        void guestCannotCreateReservation() throws Exception {
                Map<String, Object> request = buildCreateReservationRequest(
                                room1Id,
                                LocalDate.now().plusDays(5).toString(),
                                LocalDate.now().plusDays(7).toString(),
                                "CONFIRMED",
                                "Guest Blocked",
                                "guest-create@example.com",
                                "0500000000",
                                "ID-GUEST-CREATE",
                                "SA");

                mockMvc.perform(post("/api/reservations")
                                .header("Authorization", "Bearer " + guestToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden());
        }

        @Test
        void guestCannotCancelReservation() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/{id}/cancel", created.id())
                                .header("Authorization", "Bearer " + guestToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                Map.of("cancellationReason", "Guest cannot cancel here"))))
                                .andExpect(status().isForbidden());
        }

        @Test
        void guestCannotCheckInOrCheckOutReservation() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now(),
                                LocalDate.now().plusDays(2),
                                "CONFIRMED");

                mockMvc.perform(post("/api/reservations/check-in/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + guestToken))
                                .andExpect(status().isForbidden());

                mockMvc.perform(post("/api/reservations/check-out/{confirmationNumber}", created.confirmationNumber())
                                .header("Authorization", "Bearer " + guestToken))
                                .andExpect(status().isForbidden());
        }

        @Test
        void guestCannotModifyReservation() throws Exception {
                CreatedReservation created = createReservation(
                                managerToken,
                                room1Id,
                                LocalDate.now().plusDays(6),
                                LocalDate.now().plusDays(8),
                                "CONFIRMED");

                Map<String, Object> modifyRequest = buildModifyRequest(
                                room2Id,
                                LocalDate.now().plusDays(7),
                                LocalDate.now().plusDays(10),
                                "Unauthorized modify");

                mockMvc.perform(put("/api/reservations/{id}", created.id())
                                .header("Authorization", "Bearer " + guestToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isForbidden());
        }

        @Test
        void notFoundErrorsReturnConsistentPayload() throws Exception {
                long missingId = 999_999L;

                Map<String, Object> modifyRequest = new HashMap<>();
                modifyRequest.put("checkInDate", LocalDate.now().plusDays(5).toString());
                modifyRequest.put("checkOutDate", LocalDate.now().plusDays(7).toString());
                modifyRequest.put("modificationReason", "Missing reservation");

                mockMvc.perform(put("/api/reservations/{id}", missingId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.message").value("Reservation not found with id: " + missingId))
                                .andExpect(jsonPath("$.path").value("/api/reservations/" + missingId));

                String unknownConfirmation = "RSV-UNKNOWN-"
                                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                mockMvc.perform(get("/api/reservations/{confirmationNumber}", unknownConfirmation)
                                .header("Authorization", "Bearer " + managerToken))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.message")
                                                .value("Reservation not found with confirmation number: "
                                                                + unknownConfirmation))
                                .andExpect(jsonPath("$.path").value("/api/reservations/" + unknownConfirmation));
        }

        private CreatedReservation createReservation(
                        String token,
                        Long roomId,
                        LocalDate checkIn,
                        LocalDate checkOut,
                        String status) throws Exception {
                return createReservation(
                                token,
                                roomId,
                                checkIn,
                                checkOut,
                                status,
                                "Guest " + UUID.randomUUID().toString().substring(0, 6));
        }

        private CreatedReservation createReservation(
                        String token,
                        Long roomId,
                        LocalDate checkIn,
                        LocalDate checkOut,
                        String status,
                        String guestName) throws Exception {
                return createReservation(
                                token,
                                roomId,
                                checkIn,
                                checkOut,
                                status,
                                guestName,
                                "guest." + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        }

        private CreatedReservation createReservation(
                        String token,
                        Long roomId,
                        LocalDate checkIn,
                        LocalDate checkOut,
                        String status,
                        String guestName,
                        String guestEmail) throws Exception {

                Map<String, Object> request = buildCreateReservationRequest(
                                roomId,
                                checkIn.toString(),
                                checkOut.toString(),
                                status,
                                guestName,
                                guestEmail,
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

        private Map<String, Object> buildModifyRequest(
                        Long roomId,
                        LocalDate checkInDate,
                        LocalDate checkOutDate,
                        String modificationReason) {

                Map<String, Object> request = new HashMap<>();
                if (roomId != null) {
                        request.put("roomId", roomId);
                }
                if (checkInDate != null) {
                        request.put("checkInDate", checkInDate.toString());
                }
                if (checkOutDate != null) {
                        request.put("checkOutDate", checkOutDate.toString());
                }
                request.put("modificationReason", modificationReason);
                return request;
        }

        private void assertModifyBlockedAndDatabaseUnchanged(Long reservationId, Map<String, Object> modifyRequest)
                        throws Exception {
                Reservation before = reservationRepository.findById(reservationId).orElseThrow();

                mockMvc.perform(put("/api/reservations/{id}", reservationId)
                                .header("Authorization", "Bearer " + managerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(modifyRequest)))
                                .andExpect(status().is4xxClientError());

                Reservation after = reservationRepository.findById(reservationId).orElseThrow();
                assertEquals(before.getStatus(), after.getStatus());
                assertEquals(before.getRoom().getId(), after.getRoom().getId());
                assertEquals(before.getCheckInDate(), after.getCheckInDate());
                assertEquals(before.getCheckOutDate(), after.getCheckOutDate());
                assertEquals(before.getModificationReason(), after.getModificationReason());
                assertEquals(0, before.getTotalPrice().compareTo(after.getTotalPrice()));
        }

        private record CreatedReservation(Long id, String confirmationNumber) {
        }
}
