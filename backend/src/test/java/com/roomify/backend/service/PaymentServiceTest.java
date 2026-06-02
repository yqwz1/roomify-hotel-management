package com.roomify.backend.service;

import com.roomify.backend.dto.MockPaymentRequest;
import com.roomify.backend.dto.MockRefundRequest;
import com.roomify.backend.dto.PaymentResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationAuditRepository;
import com.roomify.backend.repository.ReservationHistoryRepository;
import com.roomify.backend.repository.ReservationRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceTest {

    private ReservationRepository reservationRepository;
    private PaymentRepository paymentRepository;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        reservationRepository = mock(ReservationRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        AuditService auditService = mock(AuditService.class);
        NotificationService notificationService = mock(NotificationService.class);
        EmailService emailService = mock(EmailService.class);
        ReservationFinancialService financialService = new ReservationFinancialService(new BigDecimal("0.15"));
        ReservationStatusTransitionService transitionService = new ReservationStatusTransitionService(
                mock(ReservationHistoryRepository.class),
                mock(ReservationAuditRepository.class));

        doAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            if (payment.getCreatedAt() == null) {
                payment.setCreatedAt(LocalDateTime.now());
            }
            return payment;
        }).when(paymentRepository).save(any(Payment.class));
        doAnswer(invocation -> invocation.getArgument(0)).when(reservationRepository).save(any(Reservation.class));

        paymentService = new PaymentService(
                reservationRepository,
                paymentRepository,
                auditService,
                notificationService,
                emailService,
                financialService,
                transitionService);
    }

    @Test
    void successfulGuestMockPaymentConfirmsReservationAndMarksInvoicePaid() {
        Reservation reservation = buildGuestReservation();
        when(reservationRepository.findByConfirmationNumber("RSV-DEMO1")).thenReturn(Optional.of(reservation));

        PaymentResponse response = paymentService.checkoutGuestReservation(
                "RSV-DEMO1",
                mockPayment("4242 4242 4242 4242"),
                "guest@example.com");

        assertEquals(PaymentStatus.PAID, response.getPaymentStatus());
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
        assertEquals(PaymentStatus.PAID, reservation.getPaymentStatus());
        assertEquals("PAID", reservation.getInvoiceStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), reservation.getOutstandingBalance());
        assertEquals("4242", response.getLastFourDigits());
    }

    @Test
    void failedGuestMockPaymentCancelsReservationAndDoesNotMarkInvoicePaid() {
        Reservation reservation = buildGuestReservation();
        when(reservationRepository.findByConfirmationNumber("RSV-DEMO1")).thenReturn(Optional.of(reservation));

        PaymentResponse response = paymentService.checkoutGuestReservation(
                "RSV-DEMO1",
                mockPayment("4000 0000 0000 0002"),
                "guest@example.com");

        assertEquals(PaymentStatus.FAILED, response.getPaymentStatus());
        assertEquals("CARD_DECLINED", response.getFailureReason());
        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        assertEquals(PaymentStatus.FAILED, reservation.getPaymentStatus());
        assertEquals("CANCELLED", reservation.getInvoiceStatus());
    }

    @Test
    void cancelledReservationCannotRetryGuestMockPayment() {
        Reservation reservation = buildGuestReservation();
        reservation.setStatus(ReservationStatus.CANCELLED);
        when(reservationRepository.findByConfirmationNumber("RSV-DEMO1")).thenReturn(Optional.of(reservation));

        assertThrows(ResourceConflictException.class,
                () -> paymentService.checkoutGuestReservation(
                        "RSV-DEMO1",
                        mockPayment("4242 4242 4242 4242"),
                        "guest@example.com"));
    }

    @Test
    void refundFailsWhenPaymentIsNotPaid() {
        Payment payment = new Payment();
        payment.setReservation(buildGuestReservation());
        payment.setAmount(new BigDecimal("115.00"));
        payment.setPaymentMethod(PaymentMethod.CREDIT_CARD_DEMO);
        payment.setPaymentStatus(PaymentStatus.FAILED);
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(payment));

        assertThrows(ResourceConflictException.class,
                () -> paymentService.refundPayment(10L, new MockRefundRequest(), "staff@example.com"));
    }

    @Test
    void refundPaidPaymentUpdatesPaymentAndInvoiceStatus() {
        Reservation reservation = buildGuestReservation();
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setPaymentStatus(PaymentStatus.PAID);
        reservation.setInvoiceStatus("PAID");
        reservation.setTotalPaid(new BigDecimal("115.00"));
        reservation.setOutstandingBalance(BigDecimal.ZERO.setScale(2));

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setAmount(new BigDecimal("115.00"));
        payment.setPaymentMethod(PaymentMethod.CREDIT_CARD_DEMO);
        payment.setPaymentStatus(PaymentStatus.PAID);
        when(paymentRepository.findById(11L)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.refundPayment(11L, new MockRefundRequest(), "staff@example.com");

        assertEquals(PaymentStatus.REFUNDED, response.getPaymentStatus());
        assertEquals(PaymentStatus.REFUNDED, reservation.getPaymentStatus());
        assertEquals("REFUNDED", reservation.getInvoiceStatus());
        assertEquals(new BigDecimal("115.00"), reservation.getOutstandingBalance());
    }

    @Test
    void listPaymentsCapsRequestedLimitForPrivilegedUsers() {
        Payment payment = new Payment();
        payment.setReservation(buildGuestReservation());
        payment.setAmount(new BigDecimal("115.00"));
        payment.setPaymentMethod(PaymentMethod.CREDIT_CARD_DEMO);
        payment.setPaymentStatus(PaymentStatus.PAID);

        when(paymentRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(List.of(payment));

        List<PaymentResponse> responses = paymentService.listPayments(null, "manager@example.com", true, 1000);

        assertEquals(1, responses.size());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(paymentRepository).findAllByOrderByCreatedAtDesc(pageableCaptor.capture());
        assertEquals(500, pageableCaptor.getValue().getPageSize());
    }

    private MockPaymentRequest mockPayment(String cardNumber) {
        MockPaymentRequest request = new MockPaymentRequest();
        request.setPaymentMethod(PaymentMethod.CREDIT_CARD_DEMO);
        request.setCardNumber(cardNumber);
        request.setCardholderName("Demo Guest");
        return request;
    }

    private Reservation buildGuestReservation() {
        Guest guest = new Guest("Demo Guest", "guest@example.com", "0500000000", "ID-1", "Saudi");
        RoomType roomType = new RoomType();
        roomType.setName("Deluxe");
        roomType.setBasePrice(new BigDecimal("100.00"));
        roomType.setMaxGuests(2);
        Room room = new Room("101", roomType, 1, RoomStatus.AVAILABLE);

        Reservation reservation = new Reservation();
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setCheckInDate(LocalDate.of(2026, 6, 1));
        reservation.setCheckOutDate(LocalDate.of(2026, 6, 2));
        reservation.setTotalPrice(new BigDecimal("115.00"));
        reservation.setTotalPaid(BigDecimal.ZERO.setScale(2));
        reservation.setOutstandingBalance(new BigDecimal("115.00"));
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setInvoiceStatus("PENDING");
        reservation.setStatus(ReservationStatus.PAYMENT_PENDING);
        reservation.setConfirmationNumber("RSV-DEMO1");
        return reservation;
    }
}
