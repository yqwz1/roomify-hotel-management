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
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
import com.roomify.backend.dto.ReservationFilterRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.DuplicateResourceException;
import com.roomify.backend.exception.PaymentValidationException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationAuditRepository;
import com.roomify.backend.repository.ReservationHistoryRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;

class ReservationServiceTest {

    private ReservationRepository reservationRepository;
    private GuestRepository guestRepository;
    private RoomRepository roomRepository;

    private EmailService emailService;
    private InvoiceEmailService invoiceEmailService;
    private InvoiceDeliveryLogService invoiceDeliveryLogService;
    private AuditService auditService;
    private NotificationService notificationService;
    private HousekeepingNotificationService housekeepingNotificationService;
    private ReservationFinancialService financialService;
    private ReservationHistoryRepository reservationHistoryRepository;
    private ReservationStatusTransitionService reservationStatusTransitionService;

    private ReservationService reservationService;

    @BeforeEach
    void setUp() {

        reservationRepository = mock(ReservationRepository.class);
        guestRepository = mock(GuestRepository.class);
        roomRepository = mock(RoomRepository.class);

        emailService = mock(EmailService.class);
        invoiceEmailService = mock(InvoiceEmailService.class);
        invoiceDeliveryLogService = mock(InvoiceDeliveryLogService.class);
        auditService = mock(AuditService.class);
        notificationService = mock(NotificationService.class);
        housekeepingNotificationService = mock(HousekeepingNotificationService.class);
        financialService = new ReservationFinancialService(new BigDecimal("0.15"));
        reservationHistoryRepository = mock(ReservationHistoryRepository.class);
        ReservationAuditRepository reservationAuditRepository = mock(ReservationAuditRepository.class);
        reservationStatusTransitionService = new ReservationStatusTransitionService(
                reservationHistoryRepository,
                reservationAuditRepository);

        when(reservationHistoryRepository.findByReservation_IdOrderByChangedAtAsc(anyLong()))
                .thenReturn(Collections.emptyList());

        reservationService = new ReservationService(
                reservationRepository,
                guestRepository,
                roomRepository,
                emailService,
                invoiceEmailService,
                invoiceDeliveryLogService,
                auditService,
                notificationService,
                housekeepingNotificationService,
                financialService,
                reservationStatusTransitionService,
                reservationHistoryRepository,
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
        when(guestRepository.findByIdNumber("ID-77"))
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
        when(guestRepository.findByIdNumber("ID-77"))
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
        assertEquals(PaymentStatus.UNPAID, captor.getValue().getPaymentStatus());
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
    void createForAuthenticatedGuestShouldReuseExistingGuestByIdNumberAndIgnoreSubmittedEmail() {

        Room room = buildRoom(10L, "301", "199.99");
        Guest existingGuest = new Guest(
                "Legacy Guest",
                "legacy@example.com",
                "0501111111",
                "ID-77",
                "USA");
        existingGuest.setId(21L);

        ReservationCreateRequest request = buildCreateRequest(
                10L,
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 13),
                ReservationStatus.CONFIRMED);
        request.getGuest().setEmail("spoofed@example.com");
        request.getGuest().setPhone("0509999999");

        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(reservationRepository.findOverlappingReservations(
                eq(10L),
                eq(LocalDate.of(2026, 3, 10)),
                eq(LocalDate.of(2026, 3, 13))))
                .thenReturn(Collections.emptyList());
        when(guestRepository.findByEmailIgnoreCase("member@example.com"))
                .thenReturn(Optional.empty());
        when(guestRepository.findByIdNumber("ID-77"))
                .thenReturn(Optional.of(existingGuest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.existsByConfirmationNumber(anyString())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            reservation.setId(71L);
            return reservation;
        });

        ReservationResponse response = reservationService.createForAuthenticatedGuest(request, "member@example.com");

        assertEquals(Long.valueOf(21L), response.getGuestId());
        assertEquals("member@example.com", response.getGuestEmail());
        assertEquals("member@example.com", existingGuest.getEmail());
        assertEquals("0509999999", existingGuest.getPhone());
        assertEquals(PaymentStatus.PENDING.name(), response.getPaymentStatus());
        verify(guestRepository).save(existingGuest);
    }

    @Test
    void createShouldReuseExistingGuestWhenIdNumberAlreadyExists() {

        Room room = buildRoom(10L, "301", "199.99");
        Guest existingGuest = new Guest(
                "Returning Guest",
                "returning@example.com",
                "0501234567",
                "ID-77",
                "USA");
        existingGuest.setId(21L);

        ReservationCreateRequest request = buildCreateRequest(
                10L,
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 13),
                ReservationStatus.PENDING);
        request.getGuest().setEmail("returning+new@example.com");

        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(reservationRepository.findOverlappingReservations(
                eq(10L),
                eq(LocalDate.of(2026, 3, 10)),
                eq(LocalDate.of(2026, 3, 13))))
                .thenReturn(Collections.emptyList());
        when(guestRepository.findByEmailIgnoreCase("returning+new@example.com"))
                .thenReturn(Optional.empty());
        when(guestRepository.findByIdNumber("ID-77"))
                .thenReturn(Optional.of(existingGuest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.existsByConfirmationNumber(anyString())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            reservation.setId(72L);
            return reservation;
        });

        ReservationResponse response = reservationService.create(request);

        assertEquals(Long.valueOf(21L), response.getGuestId());
        assertEquals("returning+new@example.com", response.getGuestEmail());
        verify(guestRepository).save(existingGuest);
    }

    @Test
    void createShouldRejectConflictingGuestProfilesWhenEmailAndIdNumberBelongToDifferentGuests() {

        Room room = buildRoom(10L, "301", "199.99");
        Guest guestByEmail = new Guest("Email Guest", "guest@example.com", "0500000001", "ID-100", "USA");
        guestByEmail.setId(21L);
        Guest guestByIdNumber = new Guest("Id Guest", "other@example.com", "0500000002", "ID-77", "USA");
        guestByIdNumber.setId(22L);

        ReservationCreateRequest request = buildCreateRequest(
                10L,
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 13),
                ReservationStatus.PENDING);

        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(reservationRepository.findOverlappingReservations(
                eq(10L),
                eq(LocalDate.of(2026, 3, 10)),
                eq(LocalDate.of(2026, 3, 13))))
                .thenReturn(Collections.emptyList());
        when(guestRepository.findByEmailIgnoreCase("guest@example.com"))
                .thenReturn(Optional.of(guestByEmail));
        when(guestRepository.findByIdNumber("ID-77"))
                .thenReturn(Optional.of(guestByIdNumber));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.create(request));

        assertEquals("Guest email and ID number belong to different guest profiles", ex.getMessage());
        verify(guestRepository, never()).save(any(Guest.class));
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void createShouldTranslateDuplicateGuestConstraintIntoDomainConflict() {

        Room room = buildRoom(10L, "301", "199.99");
        ReservationCreateRequest request = buildCreateRequest(
                10L,
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 13),
                ReservationStatus.PENDING);

        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(reservationRepository.findOverlappingReservations(
                eq(10L),
                eq(LocalDate.of(2026, 3, 10)),
                eq(LocalDate.of(2026, 3, 13))))
                .thenReturn(Collections.emptyList());
        when(guestRepository.findByEmailIgnoreCase("guest@example.com"))
                .thenReturn(Optional.empty());
        when(guestRepository.findByIdNumber("ID-77"))
                .thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint \"uk_guest_id_number\""));

        DuplicateResourceException ex = assertThrows(
                DuplicateResourceException.class,
                () -> reservationService.create(request));

        assertEquals(
                "A guest with this ID number already exists. Reuse the existing guest profile or verify the ID number.",
                ex.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void modifyShouldAllowCheckoutExtensionForCheckedInReservation() {

        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);

        when(reservationRepository.findById(71L))
                .thenReturn(Optional.of(reservation));

        when(reservationRepository.findOverlappingForUpdate(
                eq(10L),
                eq(LocalDate.of(2026, 4, 1)),
                eq(LocalDate.of(2026, 4, 6)),
                eq(71L)))
                .thenReturn(Collections.emptyList());

        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReservationActionPlaceholderResponse response = reservationService.modify(
                71L,
                new ReservationModifyRequest(
                        null,
                        null,
                        LocalDate.of(2026, 4, 6),
                        "Guest requested an extended stay"));

        assertEquals(ReservationStatus.CHECKED_IN, reservation.getStatus());
        assertEquals(LocalDate.of(2026, 4, 1), reservation.getCheckInDate());
        assertEquals(LocalDate.of(2026, 4, 6), reservation.getCheckOutDate());
        assertEquals(Long.valueOf(10L), reservation.getRoom().getId());
        assertEquals("Reservation modified", response.getMessage());

        verify(reservationRepository).save(any(Reservation.class));
        verify(auditService).log(eq("RESERVATION_MODIFIED"), anyString(), anyString());
    }

    @Test
    void modifyShouldRejectRoomChangeForCheckedInReservation() {

        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);

        when(reservationRepository.findById(71L))
                .thenReturn(Optional.of(reservation));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.modify(
                        71L,
                        new ReservationModifyRequest(
                                42L,
                                null,
                                LocalDate.of(2026, 4, 6),
                                "Try to reassign room")));

        assertTrue(
                ex.getMessage().contains("Checked-in reservations can only have their checkout date changed"),
                "Expected clearer checked-in error message but was: " + ex.getMessage());

        verify(reservationRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void modifyShouldRejectCheckInDateChangeForCheckedInReservation() {

        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);

        when(reservationRepository.findById(71L))
                .thenReturn(Optional.of(reservation));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.modify(
                        71L,
                        new ReservationModifyRequest(
                                null,
                                LocalDate.of(2026, 4, 2),
                                LocalDate.of(2026, 4, 6),
                                "Try to shift arrival")));

        assertTrue(
                ex.getMessage().contains("Checked-in reservations can only have their checkout date changed"),
                "Expected clearer checked-in error message but was: " + ex.getMessage());

        verify(reservationRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void modifyShouldAllowRoomReassignmentForConfirmedReservation() {

        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        Room targetRoom = buildRoom(42L, "405", "180.00");

        when(reservationRepository.findById(71L))
                .thenReturn(Optional.of(reservation));
        when(roomRepository.findById(42L))
                .thenReturn(Optional.of(targetRoom));

        when(reservationRepository.findOverlappingForUpdate(
                eq(42L),
                eq(LocalDate.of(2026, 4, 1)),
                eq(LocalDate.of(2026, 4, 4)),
                eq(71L)))
                .thenReturn(Collections.emptyList());

        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.modify(
                71L,
                new ReservationModifyRequest(
                        42L,
                        null,
                        LocalDate.of(2026, 4, 4),
                        "Upgrade room for confirmed reservation"));

        assertEquals(Long.valueOf(42L), reservation.getRoom().getId());
        assertEquals(LocalDate.of(2026, 4, 4), reservation.getCheckOutDate());
        verify(reservationRepository).save(any(Reservation.class));
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
    void checkInShouldThrowConflictWhenReservationIsNotPendingOrConfirmed() {

        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_OUT);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.checkIn("RSV-ABC123DEF456"));

        assertEquals(
                "Only PENDING, PAYMENT_PENDING, or CONFIRMED reservations can be checked in",
                ex.getMessage());
    }

    @Test
    void checkInShouldAllowPendingReservation() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.PENDING);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponse response = reservationService.checkIn("RSV-ABC123DEF456");

        assertEquals(ReservationStatus.CHECKED_IN, reservation.getStatus());
        assertEquals(RoomStatus.OCCUPIED, reservation.getRoom().getStatus());
        assertEquals(ReservationStatus.CHECKED_IN, response.getStatus());
    }

    @Test
    void checkInShouldNormalizeConfirmationNumber() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.checkIn("  rsv-abc123def456  ");

        verify(reservationRepository).findByConfirmationNumber("RSV-ABC123DEF456");
    }

    @Test
    void checkOutShouldThrowConflictWhenInvoiceIsNotFinalized() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);
        reservation.getRoom().setStatus(RoomStatus.OCCUPIED);
        reservation.setOutstandingBalance(reservation.getTotalPrice());
        reservation.setInvoiceFinalized(false);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        PaymentValidationException ex = assertThrows(
                PaymentValidationException.class,
                () -> reservationService.checkOut("RSV-ABC123DEF456"));

        assertEquals("Payment must be finalized before checkout", ex.getMessage());
    }

    @Test
    void checkOutShouldNormalizeConfirmationNumber() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);
        reservation.getRoom().setStatus(RoomStatus.OCCUPIED);
        reservation.setInvoiceFinalized(true);
        reservation.setOutstandingBalance(BigDecimal.ZERO);
        reservation.setTotalPaid(reservation.getTotalPrice());
        reservation.setPaymentStatus(PaymentStatus.PAID);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.checkOut("  rsv-abc123def456  ");

        verify(reservationRepository).findByConfirmationNumber("RSV-ABC123DEF456");
    }

    @Test
    void checkOutShouldThrowConflictWhenOutstandingIsPositive() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);
        reservation.getRoom().setStatus(RoomStatus.OCCUPIED);
        reservation.setOutstandingBalance(new BigDecimal("25.00"));
        reservation.setTotalPaid(new BigDecimal("320.00"));
        reservation.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        reservation.setInvoiceFinalized(true);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        PaymentValidationException ex = assertThrows(
                PaymentValidationException.class,
                () -> reservationService.checkOut("RSV-ABC123DEF456"));

        assertEquals("PAYMENT_BALANCE_DUE", ex.getCode());
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
        reservation.setTotalPaid(reservation.getTotalPrice());
        reservation.setPaymentStatus(PaymentStatus.PAID);

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
        verify(housekeepingNotificationService).notifyCheckoutNeedsCleaning(reservation.getRoom());
    }

    @Test
    void getAllReservationsWithoutFiltersShouldStillUseFilteredRepositoryPath() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        List<ReservationResponse> response = reservationService.getAllReservations();

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(null, null, null, null, null);
        verify(reservationRepository, never()).findAll();
    }

    @Test
    void getAllReservationsWithNullFilterRequestShouldStillUseFilteredRepositoryPath() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        List<ReservationResponse> response = reservationService.getAllReservations((ReservationFilterRequest) null);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(null, null, null, null, null);
        verify(reservationRepository, never()).findAll();
    }

    @Test
    void getAllReservationsWithFiltersShouldNormalizeAndUseFilteredRepositoryPath() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        LocalDate checkIn = LocalDate.of(2026, 4, 1);
        LocalDate checkOut = LocalDate.of(2026, 4, 3);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq("Guest"),
                eq(ReservationStatus.CONFIRMED),
                eq(checkIn),
                eq(checkOut)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setGuestName(" Guest ");
        filters.setStatus(ReservationStatus.CONFIRMED);
        filters.setCheckInDate(checkIn);
        filters.setCheckOutDate(checkOut);

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                null,
                "Guest",
                ReservationStatus.CONFIRMED,
                checkIn,
                checkOut);
        verify(reservationRepository, never()).findAll();
    }

    @Test
    void getAllReservationsWithQueueTabShouldMapToStatusFilter() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_IN);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq("Guest"),
                eq(ReservationStatus.CHECKED_IN),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setGuestName("Guest");
        filters.setQueueTab("in_house");

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                null,
                "Guest",
                ReservationStatus.CHECKED_IN,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldPrioritizeExplicitStatusOverQueueTab() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq(null),
                eq(ReservationStatus.CONFIRMED),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setQueueTab("in_house");
        filters.setStatus(ReservationStatus.CONFIRMED);

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                null,
                null,
                ReservationStatus.CONFIRMED,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldIgnoreUnsupportedQueueTabAndPreserveUnfilteredPath() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setQueueTab("frontDeskUnknown");

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                null,
                null,
                null,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldMapCamelCaseQueueTabAliases() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CHECKED_OUT);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq(null),
                eq(ReservationStatus.CHECKED_OUT),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setQueueTab("checkedOut");

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                null,
                null,
                ReservationStatus.CHECKED_OUT,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldAcceptConfirmationNumberAlias() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq("RSV-ABC123DEF456"),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setConfirmationNumber(" rsv-abc123def456 ");

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                "RSV-ABC123DEF456",
                null,
                null,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldPreferConfirmationOverConfirmationNumberAlias() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq("RSV-ABC123DEF456"),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setConfirmation(" rsv-abc123def456 ");
        filters.setConfirmationNumber("rsv-other999999");

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                "RSV-ABC123DEF456",
                null,
                null,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldPrioritizeConfirmationOverOtherFilters() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq("RSV-ABC123DEF456"),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setConfirmation(" rsv-abc123def456 ");
        filters.setGuestName("No Match");
        filters.setStatus(ReservationStatus.PENDING);
        filters.setQueueTab("in_house");
        filters.setCheckInDate(LocalDate.of(2026, 5, 1));
        filters.setCheckOutDate(LocalDate.of(2026, 5, 3));

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                "RSV-ABC123DEF456",
                null,
                null,
                null,
                null);
    }

    @Test
    void getAllReservationsShouldRejectReversedDateRangeWhenNotConfirmationScoped() {
        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setCheckInDate(LocalDate.of(2026, 5, 3));
        filters.setCheckOutDate(LocalDate.of(2026, 5, 1));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> reservationService.getAllReservations(filters));

        assertEquals("checkOutDate cannot be before checkInDate", ex.getMessage());
        verify(reservationRepository, never()).findAllByOptionalFilters(any(), any(), any(), any(), any());
    }

    @Test
    void getAllReservationsShouldIgnoreReversedDateRangeWhenConfirmationScoped() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq("RSV-ABC123DEF456"),
                eq(null),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(List.of(reservation));

        ReservationFilterRequest filters = new ReservationFilterRequest();
        filters.setConfirmation("  rsv-abc123def456  ");
        filters.setCheckInDate(LocalDate.of(2026, 5, 3));
        filters.setCheckOutDate(LocalDate.of(2026, 5, 1));

        List<ReservationResponse> response = reservationService.getAllReservations(filters);

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                "RSV-ABC123DEF456",
                null,
                null,
                null,
                null);
    }

    @Test
    void getByConfirmationNumberShouldNormalizeConfirmationNumber() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        ReservationResponse response = reservationService.getByConfirmationNumber("  rsv-abc123def456  ");

        assertEquals("RSV-ABC123DEF456", response.getConfirmationNumber());
        verify(reservationRepository).findByConfirmationNumber("RSV-ABC123DEF456");
    }

    @Test
    void getAllReservationsLegacyOverloadShouldDelegateToFilterRequestPath() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);

        when(reservationRepository.findAllByOptionalFilters(
                eq(null),
                eq("Guest"),
                eq(ReservationStatus.CONFIRMED),
                eq(LocalDate.of(2026, 4, 1)),
                eq(LocalDate.of(2026, 4, 3))))
                .thenReturn(List.of(reservation));

        List<ReservationResponse> response = reservationService.getAllReservations(
                null,
                " Guest ",
                ReservationStatus.CONFIRMED,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 3));

        assertEquals(1, response.size());
        verify(reservationRepository).findAllByOptionalFilters(
                null,
                "Guest",
                ReservationStatus.CONFIRMED,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 3));
        verify(reservationRepository, never()).findAll();
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
        reservation.setTotalPrice(new BigDecimal("345.00"));
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(new BigDecimal("345.00"));
        reservation.setPaymentStatus(PaymentStatus.UNPAID);
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
