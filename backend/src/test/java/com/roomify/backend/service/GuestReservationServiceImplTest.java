package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class GuestReservationServiceImplTest {

    private ReservationRepository reservationRepository;
    private GuestRepository guestRepository;
    private ReservationService reservationService;
    private GuestReservationServiceImpl service;

    @BeforeEach
    void setUp() {
        reservationRepository = mock(ReservationRepository.class);
        guestRepository = mock(GuestRepository.class);
        reservationService = mock(ReservationService.class);
        service = new GuestReservationServiceImpl(reservationRepository, guestRepository, reservationService);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("  guest@example.com  ", "pw", List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getGuestReservationsDeduplicatesMergedLegacyGuestProfilesByReservationId() {
        Guest primary = buildGuest(1L, "guest@example.com");
        Guest legacy = buildGuest(2L, "GUEST@EXAMPLE.COM");
        Reservation duplicateReservation = buildReservation(
                77L,
                "RSV-DUPLICATE-001",
                LocalDate.now().plusDays(3),
                LocalDate.now().plusDays(5));

        when(guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc("guest@example.com"))
                .thenReturn(List.of(primary, legacy));
        when(reservationRepository.findByGuest_Id(1L)).thenReturn(List.of(duplicateReservation));
        when(reservationRepository.findByGuest_Id(2L)).thenReturn(List.of(duplicateReservation));

        List<GuestReservationSummaryDto> result = service.getGuestReservations();

        assertEquals(1, result.size());
        assertEquals("RSV-DUPLICATE-001", result.getFirst().getConfirmationNumber());
        assertEquals("RSV-DUPLICATE-001", result.getFirst().getConfirmation());
    }

    @Test
    void getGuestReservationsReturnsOnlyActiveReservations() {
        Guest primary = buildGuest(1L, "guest@example.com");
        Reservation paymentPending = buildReservation(
                76L,
                "RSV-PAYMENT-001",
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2));
        paymentPending.setStatus(ReservationStatus.PAYMENT_PENDING);

        Reservation activeConfirmed = buildReservation(
                77L,
                "RSV-ACTIVE-001",
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3));
        activeConfirmed.setStatus(ReservationStatus.CONFIRMED);

        Reservation activeCheckedIn = buildReservation(
                78L,
                "RSV-ACTIVE-002",
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(2));
        activeCheckedIn.setStatus(ReservationStatus.CHECKED_IN);

        Reservation checkedOut = buildReservation(
                79L,
                "RSV-PAST-001",
                LocalDate.now().minusDays(5),
                LocalDate.now().minusDays(1));
        checkedOut.setStatus(ReservationStatus.CHECKED_OUT);

        Reservation expiredConfirmed = buildReservation(
                80L,
                "RSV-EXPIRED-001",
                LocalDate.now().minusDays(7),
                LocalDate.now().minusDays(2));
        expiredConfirmed.setStatus(ReservationStatus.CONFIRMED);

        when(guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc("guest@example.com"))
                .thenReturn(List.of(primary));
        when(reservationRepository.findByGuest_Id(1L)).thenReturn(
                List.of(paymentPending, activeConfirmed, activeCheckedIn, checkedOut, expiredConfirmed));

        List<GuestReservationSummaryDto> result = service.getGuestReservations();

        assertEquals(3, result.size());
        assertEquals(
                Set.of("RSV-PAYMENT-001", "RSV-ACTIVE-001", "RSV-ACTIVE-002"),
                result.stream().map(GuestReservationSummaryDto::getConfirmationNumber).collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void requireActiveGuestReservationForRoomRejectsInactiveRooms() {
        Guest primary = buildGuest(1L, "guest@example.com");
        Reservation checkedOut = buildReservation(
                79L,
                "RSV-PAST-001",
                LocalDate.now().minusDays(5),
                LocalDate.now().minusDays(1));
        checkedOut.setStatus(ReservationStatus.CHECKED_OUT);

        when(guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc("guest@example.com"))
                .thenReturn(List.of(primary));
        when(reservationRepository.findByGuest_Id(1L)).thenReturn(List.of(checkedOut));

        assertThrows(IllegalArgumentException.class, () -> service.requireActiveGuestReservationForRoom(11L));
    }

    private Guest buildGuest(Long id, String email) {
        Guest guest = new Guest("Guest", email, "0500000000", "ID-" + id, "SA");
        guest.setId(id);
        return guest;
    }

    private Reservation buildReservation(Long id, String confirmationNumber, LocalDate checkIn, LocalDate checkOut) {
        RoomType roomType = new RoomType("Suite", new BigDecimal("200.00"), 2, "WiFi", "Suite room");
        roomType.setId(10L);

        Room room = new Room("501", roomType, 5, RoomStatus.AVAILABLE);
        room.setId(11L);

        Reservation reservation = new Reservation();
        reservation.setId(id);
        reservation.setRoom(room);
        reservation.setConfirmationNumber(confirmationNumber);
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setCheckInDate(checkIn);
        reservation.setCheckOutDate(checkOut);
        reservation.setTotalPrice(new BigDecimal("200.00"));
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(new BigDecimal("200.00"));
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setInvoiceFinalized(false);
        return reservation;
    }
}
