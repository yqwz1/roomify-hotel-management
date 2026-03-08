package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.service.AuditService;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
        when(guestRepository.findByEmailIgnoreCase("guest@example.com")).thenReturn(Optional.empty());
        when(guestRepository.findByIdNumber("ID-77")).thenReturn(Optional.empty());
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
        when(guestRepository.findByEmailIgnoreCase("guest@example.com")).thenReturn(Optional.empty());
        when(guestRepository.findByIdNumber("ID-77")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> {
            Guest guest = invocation.getArgument(0);
            guest.setId(21L);
            return guest;
        });

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
        assertEquals(new BigDecimal("67.50"), response.getTaxes());
        assertEquals(new BigDecimal("517.50"), response.getTotalPrice());
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
