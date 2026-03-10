package com.roomify.backend.service;

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
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ReservationServiceTest {

    private ReservationRepository reservationRepository;
    private GuestRepository guestRepository;
    private RoomRepository roomRepository;
    private EmailService emailService;
    private AuditService auditService;
    private ReservationService reservationService;

    @BeforeEach
    void setUp() {
        reservationRepository = mock(ReservationRepository.class);
        guestRepository = mock(GuestRepository.class);
        roomRepository = mock(RoomRepository.class);
        emailService = mock(EmailService.class);
        auditService = mock(AuditService.class);

        reservationService = new ReservationService(
                reservationRepository,
                guestRepository,
                roomRepository,
                emailService,
                auditService,
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
        when(guestRepository.findByEmailIgnoreCase("guest@example.com")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> {
            Guest guest = invocation.getArgument(0);
            guest.setId(21L);
            return guest;
        });
        when(reservationRepository.existsByConfirmationNumber(anyString())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
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

        ArgumentCaptor<Reservation> savedReservationCaptor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository, times(1)).save(savedReservationCaptor.capture());
        assertEquals(new BigDecimal("689.97"), savedReservationCaptor.getValue().getTotalPrice());
        verify(emailService, times(1))
                .sendReservationConfirmationEmail(anyString(), anyString(), any(ReservationResponse.class));
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

        assertThrows(ResourceConflictException.class, () -> reservationService.create(request));
    }

    @Test
    void getByConfirmationNumberShouldReturnPriceBreakdownForUi() {
        Guest guest = new Guest("Guest", "guest@example.com", "0500000000", "ID-77", "USA");
        guest.setId(21L);

        Room room = buildRoom(10L, "301", "150.00");
        Reservation reservation = new Reservation();
        reservation.setId(71L);
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setCheckInDate(LocalDate.of(2026, 4, 1));
        reservation.setCheckOutDate(LocalDate.of(2026, 4, 4));
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setConfirmationNumber("RSV-ABC123DEF456");
        reservation.setTotalPrice(new BigDecimal("517.50"));

        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        ReservationResponse response = reservationService.getByConfirmationNumber(" rsv-abc123def456 ");

        assertEquals(3L, response.getNights());
        assertEquals(new BigDecimal("150.00"), response.getRoomRate());
        assertEquals(new BigDecimal("450.00"), response.getSubtotal());
        assertEquals(0, response.getTaxes().compareTo(new BigDecimal("67.50")));
        assertEquals(new BigDecimal("517.50"), response.getTotalPrice());
    }

    @Test
    void modifyShouldUpdateDatesRoomAndRecalculatePrice() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        Room upgradedRoom = buildRoom(20L, "402", "300.00");

        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(upgradedRoom));
        when(reservationRepository.findOverlappingForUpdate(
                eq(20L),
                eq(LocalDate.of(2026, 4, 2)),
                eq(LocalDate.of(2026, 4, 5)),
                eq(71L)))
                .thenReturn(Collections.emptyList());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.modify(
                71L,
                new ReservationModifyRequest(
                        20L,
                        LocalDate.of(2026, 4, 2),
                        LocalDate.of(2026, 4, 5),
                        " Guest upgraded room "));

        assertEquals(20L, reservation.getRoom().getId());
        assertEquals(LocalDate.of(2026, 4, 2), reservation.getCheckInDate());
        assertEquals(LocalDate.of(2026, 4, 5), reservation.getCheckOutDate());
        assertEquals("Guest upgraded room", reservation.getModificationReason());
        assertEquals(new BigDecimal("1035.00"), reservation.getTotalPrice());

        verify(emailService).sendReservationModificationEmail(
                eq("guest@example.com"),
                eq("301"),
                eq("402"),
                eq("2026-04-01"),
                eq("2026-04-02"),
                eq("2026-04-03"),
                eq("2026-04-05"),
                eq("1035.00"),
                eq("RSV-ABC123DEF456"));
    }

    @Test
    void modifyShouldReturnConflictWhenRequestedDatesOverlap() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
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

        assertEquals("Selected room is not available for the requested dates", ex.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
        verifyNoInteractions(emailService);
    }

    @Test
    void modifyShouldTrimReasonWhenUpdatingReservation() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findOverlappingForUpdate(
                eq(10L),
                eq(LocalDate.of(2026, 4, 2)),
                eq(LocalDate.of(2026, 4, 4)),
                eq(71L)))
                .thenReturn(Collections.emptyList());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.modify(
                71L,
                new ReservationModifyRequest(
                        null,
                        LocalDate.of(2026, 4, 2),
                        LocalDate.of(2026, 4, 4),
                        "   Guest moved dates   "));

        assertEquals("Guest moved dates", reservation.getModificationReason());
        assertEquals(new BigDecimal("345.00"), reservation.getTotalPrice());
    }

    @Test
    void modifyShouldSucceedEvenWhenEmailSendingFails() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findOverlappingForUpdate(
                eq(10L),
                eq(LocalDate.of(2026, 4, 2)),
                eq(LocalDate.of(2026, 4, 4)),
                eq(71L)))
                .thenReturn(Collections.emptyList());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("SMTP unavailable")).when(emailService)
                .sendReservationModificationEmail(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString());

        reservationService.modify(
                71L,
                new ReservationModifyRequest(
                        null,
                        LocalDate.of(2026, 4, 2),
                        LocalDate.of(2026, 4, 4),
                        "Guest requested date change"));

        assertEquals(LocalDate.of(2026, 4, 2), reservation.getCheckInDate());
        assertEquals(LocalDate.of(2026, 4, 4), reservation.getCheckOutDate());
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    @Test
    void modifyShouldThrowConflictWhenReservationIsCancelled() {
        assertModifyBlockedForStatus(ReservationStatus.CANCELLED);
    }

    @Test
    void modifyShouldThrowConflictWhenReservationIsCheckedIn() {
        assertModifyBlockedForStatus(ReservationStatus.CHECKED_IN);
    }

    @Test
    void modifyShouldThrowConflictWhenReservationIsCheckedOut() {
        assertModifyBlockedForStatus(ReservationStatus.CHECKED_OUT);
    }

    @Test
    void cancelShouldSetCancelledStatusTimestampAndReasonWhenProvided() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.PENDING);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.cancel(71L, new ReservationCancelRequest(" Guest changed travel plans "));

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        assertEquals("Guest changed travel plans", reservation.getCancellationReason());
        assertNotNull(reservation.getCancellationAt());
        verify(emailService).sendReservationCancellationEmail(
                eq("guest@example.com"),
                eq("Guest"),
                eq("301"),
                eq("2026-04-01"),
                eq("2026-04-03"),
                eq("517.50"),
                eq("RSV-ABC123DEF456"));
    }

    @Test
    void cancelShouldStoreNullReasonWhenRequestReasonIsBlank() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.cancel(71L, new ReservationCancelRequest("   "));

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        assertNull(reservation.getCancellationReason());
        assertNotNull(reservation.getCancellationAt());
    }

    @Test
    void cancelShouldThrowConflictWhenReservationAlreadyCheckedIn() {
        assertCancelBlockedForStatus(ReservationStatus.CHECKED_IN);
    }

    @Test
    void cancelShouldThrowConflictWhenReservationAlreadyCheckedOut() {
        assertCancelBlockedForStatus(ReservationStatus.CHECKED_OUT);
    }

    @Test
    void cancelShouldSucceedEvenWhenEmailSendingFails() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.PENDING);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("SMTP unavailable")).when(emailService)
                .sendReservationCancellationEmail(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString());

        reservationService.cancel(71L, new ReservationCancelRequest("System test"));

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        assertNotNull(reservation.getCancellationAt());
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    @Test
    void checkInShouldUpdateReservationAndRoomWhenConfirmedAndAvailable() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponse response = reservationService.checkIn(" rsv-abc123def456 ");

        assertEquals(ReservationStatus.CHECKED_IN, reservation.getStatus());
        assertEquals(RoomStatus.OCCUPIED, reservation.getRoom().getStatus());
        assertEquals(LocalDate.now(), reservation.getActualCheckInDate());
        assertEquals(2L, response.getNights());
        assertEquals(new BigDecimal("150.00"), response.getRoomRate());
        assertEquals(0, response.getSubtotal().compareTo(new BigDecimal("300.00")));
        assertEquals(0, response.getTaxes().compareTo(new BigDecimal("45.00")));
        verify(roomRepository).save(reservation.getRoom());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void checkInShouldThrowConflictWhenReservationIsNotConfirmed() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.PENDING);
        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.checkIn("RSV-ABC123DEF456"));

        assertEquals("Only CONFIRMED reservations can be checked in", ex.getMessage());
        verify(roomRepository, never()).save(any(Room.class));
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void checkInShouldThrowConflictWhenRoomIsNotAvailable() {
        Reservation reservation = buildReservationForCancel(ReservationStatus.CONFIRMED);
        reservation.getRoom().setStatus(RoomStatus.NEEDS_CLEANING);
        when(reservationRepository.findByConfirmationNumber("RSV-ABC123DEF456"))
                .thenReturn(Optional.of(reservation));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.checkIn("RSV-ABC123DEF456"));

        assertEquals("Room not ready", ex.getMessage());
        verify(roomRepository, never()).save(any(Room.class));
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    private void assertModifyBlockedForStatus(ReservationStatus status) {
        Reservation reservation = buildReservationForCancel(status);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));

        ResourceConflictException ex = assertThrows(
                ResourceConflictException.class,
                () -> reservationService.modify(
                        71L,
                        new ReservationModifyRequest(
                                20L,
                                LocalDate.of(2026, 4, 2),
                                LocalDate.of(2026, 4, 5),
                                "Attempt blocked")));

        assertEquals("Cannot modify reservation in status: " + status, ex.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
        verifyNoInteractions(emailService);
    }

    private void assertCancelBlockedForStatus(ReservationStatus status) {
        Reservation reservation = buildReservationForCancel(status);
        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));

        assertThrows(ResourceConflictException.class, () -> reservationService.cancel(71L, new ReservationCancelRequest("Reason")));

        verify(reservationRepository, never()).save(any(Reservation.class));
        verifyNoInteractions(emailService);
    }

    private Reservation buildReservationForCancel(ReservationStatus status) {
        Guest guest = new Guest("Guest", "guest@example.com", "0500000000", "ID-77", "USA");
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
        return reservation;
    }

    private Room buildRoom(Long roomId, String roomNumber, String basePrice) {
        RoomType roomType = new RoomType("Deluxe", new BigDecimal(basePrice), 2, "WiFi", "Deluxe room");
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
