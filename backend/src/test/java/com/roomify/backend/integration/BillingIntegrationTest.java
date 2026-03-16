package com.roomify.backend.integration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.Mockito.reset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

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
class BillingIntegrationTest {

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
        Mockito.when(javaMailSender.createMimeMessage())
                .thenAnswer(inv -> new MimeMessage(Session.getInstance(new Properties())));

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Suite", new BigDecimal("200.00"), 2, "WiFi, TV", "Suite room"));
        Room room = new Room("201", roomType, 2, RoomStatus.AVAILABLE);
        roomId = roomRepository.save(room).getId();
    }

    @Test
    @DisplayName("GET /{confirmationNumber}/bill returns correct totals for a basic stay")
    void getBasicBillReturnsCorrectTotals() throws Exception {
        String confirmationNumber = createReservation(
                managerToken, LocalDate.now().plusDays(5), LocalDate.now().plusDays(8));

        mockMvc.perform(get("/api/reservations/{cn}/bill", confirmationNumber)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmationNumber").value(confirmationNumber))
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.roomRate").value(200.00))
                .andExpect(jsonPath("$.roomCharge").value(600.00))
                .andExpect(jsonPath("$.serviceCharges").value(0.00))
                .andExpect(jsonPath("$.vatRate").value(0.15))
                .andExpect(jsonPath("$.vatAmount").value(90.00))
                .andExpect(jsonPath("$.discountAmount").value(0.00))
                .andExpect(jsonPath("$.balanceDue").value(690.00))
                .andExpect(jsonPath("$.lineItems.length()").value(3));
    }

    @Test
    @DisplayName("GET /{confirmationNumber}/bill recalculates totals with services and discount")
    void getBillWithServicesAndDiscountRecalculatesLive() throws Exception {
        String confirmationNumber = createReservation(
                managerToken, LocalDate.now().plusDays(10), LocalDate.now().plusDays(13));

        mockMvc.perform(get("/api/reservations/{cn}/bill", confirmationNumber)
                        .param("serviceCharges", "100.00")
                        .param("discountAmount", "50.00")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCharge").value(600.00))
                .andExpect(jsonPath("$.serviceCharges").value(100.00))
                .andExpect(jsonPath("$.vatAmount").value(105.00))
                .andExpect(jsonPath("$.discountAmount").value(50.00))
                .andExpect(jsonPath("$.balanceDue").value(755.00))
                .andExpect(jsonPath("$.lineItems.length()").value(5));
    }

    @Test
    @DisplayName("GET /unknown/bill returns 404 for unknown confirmation number")
    void getBillReturnsNotFoundForUnknownConfirmation() throws Exception {
        mockMvc.perform(get("/api/reservations/{cn}/bill", "RSV-UNKNOWN9999")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message")
                        .value("Reservation not found with confirmation number: RSV-UNKNOWN9999"));
    }

    @Test
    @DisplayName("GET /{confirmationNumber}/bill forbids guest role")
    void getBillForbiddenForGuestRole() throws Exception {
        String confirmationNumber = createReservation(
                managerToken, LocalDate.now().plusDays(20), LocalDate.now().plusDays(22));

        mockMvc.perform(get("/api/reservations/{cn}/bill", confirmationNumber)
                        .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /{confirmationNumber}/bill response contains all required fields")
    void getBillPayloadContainsAllRequiredFields() throws Exception {
        String confirmationNumber = createReservation(
                staffToken, LocalDate.now().plusDays(30), LocalDate.now().plusDays(32));

        mockMvc.perform(get("/api/reservations/{cn}/bill", confirmationNumber)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmationNumber").exists())
                .andExpect(jsonPath("$.guestName").exists())
                .andExpect(jsonPath("$.roomNumber").exists())
                .andExpect(jsonPath("$.checkInDate").exists())
                .andExpect(jsonPath("$.checkOutDate").exists())
                .andExpect(jsonPath("$.nights").exists())
                .andExpect(jsonPath("$.roomRate").exists())
                .andExpect(jsonPath("$.roomCharge").exists())
                .andExpect(jsonPath("$.serviceCharges").exists())
                .andExpect(jsonPath("$.vatRate").exists())
                .andExpect(jsonPath("$.vatAmount").exists())
                .andExpect(jsonPath("$.discountAmount").exists())
                .andExpect(jsonPath("$.balanceDue").exists())
                .andExpect(jsonPath("$.totalPaid").exists())
                .andExpect(jsonPath("$.outstandingBalance").exists())
                .andExpect(jsonPath("$.invoiceFinalized").exists())
                .andExpect(jsonPath("$.paymentStatus").exists())
                .andExpect(jsonPath("$.lineItems").isArray());
    }

    private String createReservation(String token, LocalDate checkIn, LocalDate checkOut) throws Exception {
        Map<String, Object> guest = new HashMap<>();
        guest.put("name", "Test Guest");
        guest.put("email", "bill-test-" + System.nanoTime() + "@example.com");
        guest.put("phone", "0500000000");
        guest.put("idNumber", "ID-BILL-" + System.nanoTime());
        guest.put("nationality", "SA");

        Map<String, Object> request = new HashMap<>();
        request.put("roomId", roomId);
        request.put("checkInDate", checkIn.toString());
        request.put("checkOutDate", checkOut.toString());
        request.put("status", "CONFIRMED");
        request.put("guest", guest);

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
}
