package com.roomify.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.PaymentValidationException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;

class ReservationServiceTest {

        private ReservationRepository reservationRepository;
        private GuestRepository guestRepository;
        private RoomRepository roomRepository;

        private EmailService emailService;
        private AuditService auditService;
        private HousekeepingNotificationService housekeepingNotificationService;

        private InvoiceEmailService invoiceEmailService;
        private InvoiceDeliveryLogService invoiceDeliveryLogService;

        private ReservationService reservationService;

        @BeforeEach
        void setUp() {

                reservationRepository = mock(ReservationRepository.class);
                guestRepository = mock(GuestRepository.class);
                roomRepository = mock(RoomRepository.class);

                emailService = mock(EmailService.class);
                auditService = mock(AuditService.class);
                housekeepingNotificationService = mock(HousekeepingNotificationService.class);

                reservationService = new ReservationService(
                                reservationRepository,
                                guestRepository,
                                roomRepository,
                                emailService,
                                auditService,
                                housekeepingNotificationService,
                                new BigDecimal("0.15"));
        }

        @Test
        void createShouldCalculateNightsTaxesAndTotalUsingConfiguredTaxRate() {

                Room room = buildRoom(10L, "301", "199.99");

                ReservationCreateRequest request = buildCreateRequest(
                                10L,
                                LocalDate.of(2026, 3, 10),
                                LocalDate.of(2026, 3, 13),
                                ReservationStatus.CONFIRMED);

                when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

                when(reservationRepository.findOverlappingReservations(
                                eq(10L),
                                eq(LocalDate.of(2026, 3, 10)),
                                eq(LocalDate.of(2026, 3, 13))))
                                .thenReturn(Collections.emptyList());

                when(guestRepository.findByEmailIgnoreCase("guest@example.com"))
                                .thenReturn(Optional.empty());

                when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> {
                        Guest guest = invocation.getArgument(0);
                        guest.setId(21L);
                        return guest;
                });

                when(reservationRepository.existsByConfirmationNumber(anyString()))
                                .thenReturn(false);

                when(reservationRepository.save(any(Reservation.class)))
                                .thenAnswer(invocation -> {
                                        Reservation reservation = invocation.getArgument(0);
                                        reservation.setId(71L);
                                        return reservation;
                                });

                ReservationResponse response = reservationService.create(request);

                assertEquals(3L, response.getNights());
                assertEquals(new BigDecimal("199.99"), response.getRoomRate());
                assertEquals(new BigDecimal("599.97"), response.getSubtotal());
                assertEquals(new BigDecimal("90.00"), response.getTaxes());
                assertEquals(new BigDecimal("689.97"), response.getTotalPrice());

                verify(emailService).sendReservationConfirmationEmail(
                                anyString(),
                                anyString(),
                                any(ReservationResponse.class));
        }

        @Test
        void createShouldThrowConflictWhenDateRangeHasZeroNights() {

                Room room = buildRoom(10L, "301", "120.00");

                ReservationCreateRequest request = buildCreateRequest(
                                10L,
                                LocalDate.of(2026, 3, 10),
                                LocalDate.of(2026, 3, 10),
                                ReservationStatus.PENDING);

                when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

                assertThrows(ResourceConflictException.class,
                                () -> reservationService.create(request));
        }

        @Test
        void createShouldDefaultStatusToPendingWhenStatusIsMissing() {

                Room room = buildRoom(10L, "301", "120.00");

                ReservationCreateRequest request = buildCreateRequest(
                                10L,
                                LocalDate.of(2026, 3, 10),
                                LocalDate.of(2026, 3, 12),
                                null);

                when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

                when(reservationRepository.findOverlappingReservations(
                                eq(10L),
                                eq(LocalDate.of(2026, 3, 10)),
                                eq(LocalDate.of(2026, 3, 12))))
                                .thenReturn(Collections.emptyList());

                when(guestRepository.findByEmailIgnoreCase("guest@example.com"))
                                .thenReturn(Optional.empty());

                when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> {
                        Guest guest = invocation.getArgument(0);
                        guest.setId(21L);
                        return guest;
                });

                when(reservationRepository.existsByConfirmationNumber(anyString()))
                                .thenReturn(false);

                when(reservationRepository.save(any(Reservation.class)))
                                .thenAnswer(invocation -> {
                                        Reservation reservation = invocation.getArgument(0);
                                        reservation.setId(71L);
                                        return reservation;
                                });

                ReservationResponse response = reservationService.create(request);

                assertEquals(ReservationStatus.PENDING, response.getStatus());

                ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
                verify(reservationRepository).save(captor.capture());
                assertEquals(ReservationStatus.PENDING, captor.getValue().getStatus());
        }

        @Test
        void modifyShouldReturnConflictWhenRequestedDatesOverlap() {

                Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

                when(reservationRepository.findById(71L))
                                .thenReturn(Optional.of(reservation));

                when(reservationRepository.findOverlappingForUpdate(
                                eq(10L),
                                eq(LocalDate.of(2026, 4, 2)),
                                eq(LocalDate.of(2026, 4, 5)),
                                eq(71L)))
                                .thenReturn(List.of(new Reservation()));

                ResourceConflictException ex = assertThrows(
                                ResourceConflictException.class,
                                () -> reservationService.modify(
                                                71L,
                                                new ReservationModifyRequest(
                                                                null,
                                                                LocalDate.of(2026, 4, 2),
                                                                LocalDate.of(2026, 4, 5),
                                                                "Shift dates")));

                assertEquals(
                                "Selected room is not available for the requested dates",
                                ex.getMessage());

                verify(reservationRepository, never()).save(any());
                verifyNoInteractions(emailService);
        }

        @Test
        void cancelShouldStoreNullReasonWhenRequestReasonIsBlank() {

                Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

                when(reservationRepository.findById(71L))
                                .thenReturn(Optional.of(reservation));

                when(reservationRepository.save(any()))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                reservationService.cancel(71L, new ReservationCancelRequest("   "));

                assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
                assertNull(reservation.getCancellationReason());
                assertNotNull(reservation.getCancellationAt());
        }

        @Test
        void checkInShouldThrowConflictWhenReservationIsNotConfirmed() {

                Reservation reservation = buildReservationForCancel(ReservationStatus.PENDING);

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                                .thenReturn(Optional.of(reservation));

                ResourceConflictException ex = assertThrows(
                                ResourceConflictException.class,
                                () -> reservationService.checkIn("RSV-ABC123DEF456"));

                assertEquals(
                                "Only CONFIRMED reservations can be checked in",
                                ex.getMessage());
        }

        @Test
        void checkOutShouldThrowConflictWhenInvoiceIsNotFinalized() {
                Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);
                reservation.getRoom().setStatus(RoomStatus.OCCUPIED);
                reservation.setOutstandingBalance(BigDecimal.ZERO);
                reservation.setInvoiceFinalized(false);

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                                .thenReturn(Optional.of(reservation));

                PaymentValidationException ex = assertThrows(
                                PaymentValidationException.class,
                                () -> reservationService.checkOut("RSV-ABC123DEF456"));

                assertEquals("Payment must be finalized before checkout", ex.getMessage());
        }

        @Test
        void checkOutShouldThrowConflictWhenOutstandingIsPositive() {
                Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);
                reservation.getRoom().setStatus(RoomStatus.OCCUPIED);
                reservation.setOutstandingBalance(new BigDecimal("25.00"));
                reservation.setInvoiceFinalized(true);

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                                .thenReturn(Optional.of(reservation));

                ResourceConflictException ex = assertThrows(
                                ResourceConflictException.class,
                                () -> reservationService.checkOut("RSV-ABC123DEF456"));

                assertTrue(ex.getMessage().contains("Outstanding balance must be 0.00 before checkout"));
        }

        @Test
        void checkOutShouldReturnIdempotentResponseWhenAlreadyCheckedOut() {
                Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_OUT);
                reservation.setInvoiceFinalized(true);
                reservation.setOutstandingBalance(BigDecimal.ZERO);

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                                .thenReturn(Optional.of(reservation));

                ReservationActionPlaceholderResponse response = reservationService.checkOut("RSV-ABC123DEF456");

                assertEquals("check-out", response.getAction());
                assertEquals("Checkout already completed", response.getMessage());
                verify(reservationRepository, never()).save(any());
                verify(roomRepository, never()).save(any());
        }

        @Test
        void checkOutShouldSucceedAndPersistCheckoutTimestamp() {
                Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);
                reservation.getRoom().setStatus(RoomStatus.OCCUPIED);
                reservation.setInvoiceFinalized(true);
                reservation.setOutstandingBalance(BigDecimal.ZERO);

                when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                                .thenReturn(Optional.of(reservation));
                when(reservationRepository.save(any(Reservation.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));
                when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

                ReservationActionPlaceholderResponse response = reservationService.checkOut("RSV-ABC123DEF456");

                assertEquals(ReservationStatus.CHECKED_OUT, reservation.getStatus());
                assertEquals(RoomStatus.NEEDS_CLEANING, reservation.getRoom().getStatus());
                assertNotNull(reservation.getActualCheckOutAt());
                assertEquals("Checkout completed successfully", response.getMessage());
                verify(housekeepingNotificationService).notifyCheckoutNeedsCleaning("301");
        }

        private Reservation buildReservationForCancel(ReservationStatus status) {

                Guest guest = new Guest(
                                "Guest",
                                "guest@example.com",
                                "0500000000",
                                "ID-77",
                                "USA");

                guest.setId(21L);

                Room room = buildRoom(10L, "301", "150.00");

                Reservation reservation = new Reservation();

                reservation.setId(71L);
                reservation.setGuest(guest);
                reservation.setRoom(room);
                reservation.setCheckInDate(LocalDate.of(2026, 4, 1));
                reservation.setCheckOutDate(LocalDate.of(2026, 4, 3));
                reservation.setStatus(status);
                reservation.setConfirmationNumber("RSV-ABC123DEF456");
                reservation.setTotalPrice(new BigDecimal("517.50"));
                reservation.setTotalPaid(BigDecimal.ZERO);
                reservation.setOutstandingBalance(new BigDecimal("517.50"));
                reservation.setInvoiceFinalized(false);

                return reservation;
        }

        private Room buildRoom(Long roomId, String roomNumber, String basePrice) {

                RoomType roomType = new RoomType(
                                "Deluxe",
                                new BigDecimal(basePrice),
                                2,
                                "WiFi",
                                "Deluxe room");

                roomType.setId(5L);

                Room room = new Room(roomNumber, roomType, 3, RoomStatus.AVAILABLE);

                room.setId(roomId);

                return room;
        }

        private ReservationCreateRequest buildCreateRequest(
                        Long roomId,
                        LocalDate checkIn,
                        LocalDate checkOut,
                        ReservationStatus status) {

                return new ReservationCreateRequest(
                                roomId,
                                checkIn,
                                checkOut,
                                status,
                                new ReservationGuestRequest(
                                                "Guest",
                                                "guest@example.com",
                                                "0500000000",
                                                "ID-77",
                                                "USA"));
        }
}