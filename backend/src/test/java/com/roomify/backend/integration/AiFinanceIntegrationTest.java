package com.roomify.backend.integration;

import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:aifinancedb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000"
})
class AiFinanceIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private GuestRepository guestRepository;

    private MockMvc mockMvc;
    private String managerToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        expenseRepository.deleteAll();
        paymentRepository.deleteAll();
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        guestRepository.deleteAll();

        seedAnalyticsData();

        managerToken = jwtUtils.generateToken("manager@roomify.com", "ROLE_MANAGER");
        staffToken = jwtUtils.generateToken("staff@roomify.com", "ROLE_STAFF");
    }

    @Test
    void managerCanFetchAiFinanceAnalytics() throws Exception {
        mockMvc.perform(get("/api/ai-finance/data-summary")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservations").value(3))
                .andExpect(jsonPath("$.payments").value(2))
                .andExpect(jsonPath("$.expenses").value(2))
                .andExpect(jsonPath("$.roomTypes").value(2))
                .andExpect(jsonPath("$.totalRevenue").value(800.00))
                .andExpect(jsonPath("$.dateRangeStart").value("2026-04-01"))
                .andExpect(jsonPath("$.dateRangeEnd").value("2026-04-04"));

        mockMvc.perform(get("/api/ai-finance/summary")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thisWeekRevenue").value(800.00))
                .andExpect(jsonPath("$.lastWeekRevenue").value(0.00))
                .andExpect(jsonPath("$.topRoomType").value("Deluxe"))
                .andExpect(jsonPath("$.totalExpenses").value(130.00))
                .andExpect(jsonPath("$.netProfit").value(670.00));

        mockMvc.perform(get("/api/ai-finance/revenue-trend")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("start", "2026-04-01")
                        .param("end", "2026-04-04"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-04-01"))
                .andExpect(jsonPath("$[0].revenue").value(200.00))
                .andExpect(jsonPath("$[1].revenue").value(600.00))
                .andExpect(jsonPath("$[2].revenue").value(0.00))
                .andExpect(jsonPath("$[3].revenue").value(0.00));

        mockMvc.perform(get("/api/ai-finance/occupancy-trend")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("start", "2026-04-01")
                        .param("end", "2026-04-04"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].occupiedRoomNights").value(1))
                .andExpect(jsonPath("$[0].totalRoomNights").value(3))
                .andExpect(jsonPath("$[1].occupiedRoomNights").value(2))
                .andExpect(jsonPath("$[3].occupiedRoomNights").value(1));

        mockMvc.perform(get("/api/ai-finance/room-type-revenue")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomType").value("Deluxe"))
                .andExpect(jsonPath("$[0].revenue").value(600.00))
                .andExpect(jsonPath("$[1].roomType").value("Standard"))
                .andExpect(jsonPath("$[1].revenue").value(200.00));

        mockMvc.perform(get("/api/ai-finance/training-data")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("start", "2026-04-01")
                        .param("end", "2026-04-04"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(8))
                .andExpect(jsonPath("$[0].date").value("2026-04-01"))
                .andExpect(jsonPath("$[0].roomType").value("Standard"))
                .andExpect(jsonPath("$[0].totalRooms").value(2))
                .andExpect(jsonPath("$[0].dailyRevenue").exists())
                .andExpect(jsonPath("$[0].occupancyRate").isNumber());

        mockMvc.perform(get("/api/ai-finance/training-data.csv")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("start", "2026-04-01")
                        .param("end", "2026-04-04"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(
                        "date,dayOfWeek,month,weekend,roomType,roomTypeId,totalRooms")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("2026-04-01")));
    }

    @Test
    void staffCannotAccessAiFinanceResources() throws Exception {
        mockMvc.perform(get("/api/ai-finance/data-summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    private void seedAnalyticsData() {
        RoomType standard = roomTypeRepository.save(new RoomType(
                "Standard",
                new BigDecimal("100.00"),
                2,
                "WiFi",
                "Standard room"));
        RoomType deluxe = roomTypeRepository.save(new RoomType(
                "Deluxe",
                new BigDecimal("200.00"),
                3,
                "WiFi, Breakfast",
                "Deluxe room"));

        Room standard101 = roomRepository.save(new Room("101", standard, 1, RoomStatus.AVAILABLE));
        Room standard102 = roomRepository.save(new Room("102", standard, 1, RoomStatus.AVAILABLE));
        Room deluxe201 = roomRepository.save(new Room("201", deluxe, 2, RoomStatus.AVAILABLE));

        Guest guestOne = guestRepository.save(new Guest(
                "Alice Guest",
                "alice@example.com",
                "1234567890",
                "ID-100",
                "SA"));
        Guest guestTwo = guestRepository.save(new Guest(
                "Bob Guest",
                "bob@example.com",
                "0987654321",
                "ID-101",
                "SA"));

        Reservation reservationOne = reservationRepository.save(buildReservation(
                guestOne,
                standard101,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 3),
                "200.00",
                ReservationStatus.CONFIRMED,
                "AI-RES-001"));
        Reservation reservationTwo = reservationRepository.save(buildReservation(
                guestTwo,
                standard102,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2),
                "120.00",
                ReservationStatus.CANCELLED,
                "AI-RES-002"));
        Reservation reservationThree = reservationRepository.save(buildReservation(
                guestTwo,
                deluxe201,
                LocalDate.of(2026, 4, 2),
                LocalDate.of(2026, 4, 5),
                "600.00",
                ReservationStatus.CHECKED_OUT,
                "AI-RES-003"));

        paymentRepository.save(buildPayment(reservationOne, "200.00", LocalDateTime.of(2026, 4, 1, 10, 0)));
        paymentRepository.save(buildPayment(reservationThree, "300.00", LocalDateTime.of(2026, 4, 3, 12, 0)));

        expenseRepository.save(buildExpense("Laundry", "50.00", LocalDate.of(2026, 4, 1)));
        expenseRepository.save(buildExpense("Supplies", "80.00", LocalDate.of(2026, 4, 3)));
    }

    private Reservation buildReservation(
            Guest guest,
            Room room,
            LocalDate checkIn,
            LocalDate checkOut,
            String totalPrice,
            ReservationStatus status,
            String confirmationNumber) {
        Reservation reservation = new Reservation(guest, room, checkIn, checkOut, new BigDecimal(totalPrice), status, confirmationNumber);
        reservation.setCreatedAt(checkIn.atStartOfDay());
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(new BigDecimal(totalPrice));
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        return reservation;
    }

    private Payment buildPayment(Reservation reservation, String amount, LocalDateTime createdAt) {
        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setAmount(new BigDecimal(amount));
        payment.setPaymentMethod(PaymentMethod.CARD);
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setCreatedAt(createdAt);
        return payment;
    }

    private Expense buildExpense(String title, String amount, LocalDate expenseDate) {
        Expense expense = new Expense();
        expense.setTitle(title);
        expense.setDescription(title + " expense");
        expense.setCategory(ExpenseCategory.MISCELLANEOUS);
        expense.setAmount(new BigDecimal(amount));
        expense.setExpenseDate(expenseDate);
        expense.setVendor("Vendor");
        expense.setPaymentMethod(PaymentMethod.CASH);
        return expense;
    }
}
