package com.roomify.backend.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.AuditLog;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.AuditLogRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.InvoiceDeliveryLogRepository;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
        "spring.datasource.url=jdbc:h2:mem:invoicedb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class InvoiceIntegrationTest {

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
    private InvoiceDeliveryLogRepository invoiceDeliveryLogRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JavaMailSender javaMailSender;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String managerToken;
    private Long roomId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");

        paymentRepository.deleteAll();
        invoiceDeliveryLogRepository.deleteAll();
        auditLogRepository.deleteAll();
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();

        reset(javaMailSender);
        when(javaMailSender.createMimeMessage())
                .thenAnswer(invocation -> new MimeMessage(Session.getInstance(new Properties())));

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Suite", new BigDecimal("200.00"), 2, "WiFi, TV", "Suite room"));
        roomId = roomRepository.save(new Room("410", roomType, 4, RoomStatus.AVAILABLE)).getId();
    }

    @Test
    @DisplayName("Invoice delivery status ignores receipt emails until an invoice email is attempted")
    void invoiceDeliveryStatusIgnoresReceiptLogs() throws Exception {
        CreatedReservation created = createAndFullyPayReservation();

        mockMvc.perform(get("/api/invoices/{reservationId}/delivery-status", created.id())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value("UNKNOWN"));

        mockMvc.perform(post("/api/invoices/{reservationId}/email", created.id())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SENT"));

        mockMvc.perform(get("/api/invoices/{reservationId}/delivery-status", created.id())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SENT"));
    }

    @Test
    @DisplayName("Invoice email failures are logged and audited without blocking the finalized reservation")
    void invoiceEmailFailureIsLoggedAndAudited() throws Exception {
        CreatedReservation created = createAndFullyPayReservation();

        doThrow(new MailSendException("Mailbox rejected"))
                .when(javaMailSender)
                .send(any(MimeMessage.class));

        mockMvc.perform(post("/api/invoices/{reservationId}/email", created.id())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.errorMessage").value("Failed to send invoice email"));

        List<AuditLog> logs = auditLogRepository.findAll();
        org.junit.jupiter.api.Assertions.assertTrue(
                logs.stream().anyMatch(log -> "INVOICE_EMAIL_FAILED".equals(log.getAction())));
        org.junit.jupiter.api.Assertions.assertTrue(
                reservationRepository.findById(created.id()).orElseThrow().isInvoiceFinalized());
    }

    private CreatedReservation createAndFullyPayReservation() throws Exception {
        CreatedReservation created = createReservation();

        Map<String, Object> payment = new HashMap<>();
        payment.put("amount", "690.00");

        mockMvc.perform(post("/api/reservations/{cn}/bill/payments", created.confirmationNumber())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payment)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.invoiceFinalized").value(true));

        return created;
    }

    private CreatedReservation createReservation() throws Exception {
        Map<String, Object> guest = new HashMap<>();
        guest.put("name", "Invoice Guest");
        guest.put("email", "invoice-test-" + System.nanoTime() + "@example.com");
        guest.put("phone", "0500000000");
        guest.put("idNumber", "ID-INV-" + System.nanoTime());
        guest.put("nationality", "SA");

        Map<String, Object> request = new HashMap<>();
        request.put("roomId", roomId);
        request.put("checkInDate", LocalDate.now().plusDays(1).toString());
        request.put("checkOutDate", LocalDate.now().plusDays(4).toString());
        request.put("status", "CONFIRMED");
        request.put("guest", guest);

        String response = mockMvc.perform(post("/api/reservations")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();
        String confirmationNumber = objectMapper.readTree(response).get("confirmationNumber").asText();
        return new CreatedReservation(id, confirmationNumber);
    }

    private record CreatedReservation(Long id, String confirmationNumber) {
    }
}
