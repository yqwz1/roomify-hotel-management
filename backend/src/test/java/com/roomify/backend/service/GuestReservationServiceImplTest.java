package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class GuestReservationServiceImplTest {

    private ReservationRepository reservationRepository;
    private GuestRepository guestRepository;
    private GuestReservationServiceImpl service;

    @BeforeEach
    void setUp() {
        reservationRepository = mock(ReservationRepository.class);
        guestRepository = mock(GuestRepository.class);
        service = new GuestReservationServiceImpl(reservationRepository, guestRepository);

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
