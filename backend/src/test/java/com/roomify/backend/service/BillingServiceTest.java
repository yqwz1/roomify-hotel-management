package com.roomify.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.PaymentValidationException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;

class BillingServiceTest {

        private ReservationRepository reservationRepository;
        private AuditService auditService;
        private BillingService billingService;

        @BeforeEach
        void setUp() {
                reservationRepository = mock(ReservationRepository.class);
                auditService = mock(AuditService.class);

                billingService = new BillingService(
                                reservationRepository,
                                auditService,
                                new BigDecimal("0.15"));
        }

        @Test
        void calculateBillShouldReturnBasicItemisedBreakdown() {
                Reservation reservation = buildReservation(
                                "200.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 23));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                BillResponse response = billingService.calculateBill(
                                " rsv-abc123 ",
                                BigDecimal.ZERO,
                                BigDecimal.ZERO);

                assertEquals(3L, response.getNights());
                assertEquals(new BigDecimal("200.00"), response.getRoomRate());
                assertEquals(new BigDecimal("600.00"), response.getRoomCharge());
                assertEquals(new BigDecimal("0.00"), response.getServiceCharges());
                assertEquals(new BigDecimal("90.00"), response.getVatAmount());
                assertEquals(new BigDecimal("0.00"), response.getDiscountAmount());
                assertEquals(new BigDecimal("690.00"), response.getBalanceDue());
                assertEquals(3, response.getLineItems().size());

                verify(auditService).log(
                                eq("BILL_CALCULATED"),
                                eq("RSV-ABC123"),
                                contains("balanceDue=690.00"));
        }

        @Test
        void calculateBillShouldIncludeServicesAndDiscount() {
                Reservation reservation = buildReservation(
                                "180.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 22));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                BillResponse response = billingService.calculateBill(
                                "RSV-ABC123",
                                new BigDecimal("40.00"),
                                new BigDecimal("25.00"));

                assertEquals(new BigDecimal("360.00"), response.getRoomCharge());
                assertEquals(new BigDecimal("40.00"), response.getServiceCharges());
                assertEquals(new BigDecimal("60.00"), response.getVatAmount());
                assertEquals(new BigDecimal("25.00"), response.getDiscountAmount());
                assertEquals(new BigDecimal("435.00"), response.getBalanceDue());
                assertEquals(5, response.getLineItems().size());
        }

        @Test
        void calculateBillShouldNormaliseNegativeInputsToZero() {
                Reservation reservation = buildReservation(
                                "150.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 22));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                BillResponse response = billingService.calculateBill(
                                "RSV-ABC123",
                                new BigDecimal("-10.00"),
                                new BigDecimal("-5.00"));

                assertEquals(new BigDecimal("0.00"), response.getServiceCharges());
                assertEquals(new BigDecimal("0.00"), response.getDiscountAmount());
                assertEquals(new BigDecimal("345.00"), response.getBalanceDue());
        }

        @Test
        void calculateBillShouldThrowWhenReservationIsMissing() {
                when(reservationRepository.findByConfirmationNumber("RSV-MISSING"))
                                .thenReturn(Optional.empty());

                assertThrows(
                                ResourceNotFoundException.class,
                                () -> billingService.calculateBill(
                                                "RSV-MISSING",
                                                BigDecimal.ZERO,
                                                BigDecimal.ZERO));
        }

        @Test
        void calculateBillShouldThrowWhenNightsAreZeroOrNegative() {
                Reservation reservation = buildReservation(
                                "200.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 20));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                assertThrows(
                                IllegalArgumentException.class,
                                () -> billingService.calculateBill(
                                                "RSV-ABC123",
                                                BigDecimal.ZERO,
                                                BigDecimal.ZERO));
        }

        @Test
        void calculateBillShouldNeverReturnNegativeBalance() {
                Reservation reservation = buildReservation(
                                "150.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 22));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                BillResponse response = billingService.calculateBill(
                                "RSV-ABC123",
                                BigDecimal.ZERO,
                                new BigDecimal("1000.00"));

                assertEquals(new BigDecimal("0.00"), response.getBalanceDue());
        }

        @Test
        void recordPaymentShouldMarkAsPartiallyPaidAndUpdateOutstanding() {
                Reservation reservation = buildReservation(
                                "200.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 23));

                reservation.setTotalPrice(new BigDecimal("690.00"));
                reservation.setTotalPaid(new BigDecimal("100.00"));
                reservation.setOutstandingBalance(new BigDecimal("590.00"));
                reservation.setInvoiceFinalized(false);

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                when(reservationRepository.save(any(Reservation.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                BillResponse response = billingService.recordPayment(
                                "RSV-ABC123",
                                new BigDecimal("250.00"));

                assertEquals(new BigDecimal("350.00"), response.getTotalPaid());
                assertEquals(new BigDecimal("340.00"), response.getOutstandingBalance());
                assertEquals("PARTIALLY_PAID", response.getPaymentStatus());
                assertFalse(response.isInvoiceFinalized());

                verify(reservationRepository).save(any(Reservation.class));
        }

        @Test
        void recordPaymentShouldBlockOverpayment() {
                Reservation reservation = buildReservation(
                                "200.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 23));

                reservation.setTotalPrice(new BigDecimal("690.00"));
                reservation.setTotalPaid(new BigDecimal("680.00"));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                PaymentValidationException ex = assertThrows(
                                PaymentValidationException.class,
                                () -> billingService.recordPayment(
                                                "RSV-ABC123",
                                                new BigDecimal("20.00")));

                assertEquals("PAYMENT_OVERPAYMENT_BLOCKED", ex.getCode());
                assertEquals(new BigDecimal("10.00"), ex.getOutstandingBalance());
        }

        @Test
        void recordPaymentShouldAutoFinalizeAfterFullPayment() {
                Reservation reservation = buildReservation(
                                "200.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 23));

                reservation.setTotalPrice(new BigDecimal("690.00"));
                reservation.setTotalPaid(new BigDecimal("500.00"));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                when(reservationRepository.save(any(Reservation.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                BillResponse response = billingService.recordPayment(
                                "RSV-ABC123",
                                new BigDecimal("190.00"));

                assertEquals(new BigDecimal("690.00"), response.getTotalPaid());
                assertEquals(new BigDecimal("0.00"), response.getOutstandingBalance());
                assertEquals("PAID", response.getPaymentStatus());
                assertTrue(response.isInvoiceFinalized());
        }

        @Test
        void closeBillShouldFinalizeWhenFullyPaid() {
                Reservation reservation = buildReservation(
                                "200.00",
                                LocalDate.of(2026, 3, 20),
                                LocalDate.of(2026, 3, 23));

                reservation.setTotalPrice(new BigDecimal("690.00"));
                reservation.setTotalPaid(new BigDecimal("690.00"));

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123"))
                                .thenReturn(Optional.of(reservation));

                when(reservationRepository.save(any(Reservation.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                BillResponse response = billingService.closeBill("RSV-ABC123");

                assertTrue(response.isInvoiceFinalized());
                assertEquals("PAID", response.getPaymentStatus());
                assertEquals(new BigDecimal("0.00"), response.getOutstandingBalance());
        }

        private Reservation buildReservation(
                        String roomRate,
                        LocalDate checkIn,
                        LocalDate checkOut) {

                Guest guest = new Guest(
                                "Guest",
                                "guest@example.com",
                                "0500000000",
                                "ID-77",
                                "SA");

                RoomType roomType = new RoomType(
                                "Suite",
                                new BigDecimal(roomRate),
                                2,
                                "WiFi",
                                "Suite");

                Room room = new Room("201", roomType, 2, RoomStatus.AVAILABLE);

                Reservation reservation = new Reservation();
                reservation.setGuest(guest);
                reservation.setRoom(room);
                reservation.setCheckInDate(checkIn);
                reservation.setCheckOutDate(checkOut);
                reservation.setStatus(ReservationStatus.CONFIRMED);
                reservation.setConfirmationNumber("RSV-ABC123");

                long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);

                BigDecimal roomCharge = new BigDecimal(roomRate)
                                .multiply(BigDecimal.valueOf(nights));

                BigDecimal vatAmount = roomCharge.multiply(new BigDecimal("0.15"));

                BigDecimal totalPrice = roomCharge
                                .add(vatAmount)
                                .setScale(2, RoundingMode.HALF_UP);

                reservation.setTotalPrice(totalPrice);
                reservation.setTotalPaid(new BigDecimal("0.00"));
                reservation.setOutstandingBalance(totalPrice);
                reservation.setInvoiceFinalized(false);

                return reservation;
        }
}