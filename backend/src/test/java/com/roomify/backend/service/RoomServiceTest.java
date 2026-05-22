package com.roomify.backend.service;

import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.CannotDeleteException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoomServiceTest {

    private RoomRepository roomRepository;
    private RoomTypeRepository roomTypeRepository;
    private ReservationRepository reservationRepository;
    private HousekeepingNotificationService housekeepingNotificationService;
    private ReservationFinancialService financialService;
    private RoomService roomService;

    private Room room;

    @BeforeEach
    void setUp() {
        roomRepository = mock(RoomRepository.class);
        roomTypeRepository = mock(RoomTypeRepository.class);
        reservationRepository = mock(ReservationRepository.class);
        housekeepingNotificationService = mock(HousekeepingNotificationService.class);
        financialService = new ReservationFinancialService(new BigDecimal("0.15"));

        roomService = new RoomService(
                roomRepository,
                roomTypeRepository,
                reservationRepository,
                housekeepingNotificationService,
                financialService
        );

        RoomType type = new RoomType();
        type.setId(1L);
        type.setName("Deluxe");
        type.setBasePrice(BigDecimal.valueOf(200));
        type.setMaxGuests(2);

        room = new Room();
        room.setId(1L);
        room.setRoomNumber("101");
        room.setRoomType(type);
        room.setFloor(1);
        room.setStatus(RoomStatus.NEEDS_CLEANING);
    }

    @Test
    void shouldAllowValidStatusTransition() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(roomRepository.findByRoomNumber("101")).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(i -> i.getArgument(0));

        roomService.updateStatus(1L, "AVAILABLE");

        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
        verify(housekeepingNotificationService, times(1)).notifyRoomReady(room);
    }

    @Test
    void shouldThrowExceptionForInvalidStatusTransition() {
        room.setStatus(RoomStatus.AVAILABLE);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        assertThrows(ResourceConflictException.class, () ->
                roomService.updateStatus(1L, "OCCUPIED")
        );
    }

    @Test
    void shouldBlockManualChangesForOccupiedRoom() {
        room.setStatus(RoomStatus.OCCUPIED);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        assertThrows(ResourceConflictException.class, () ->
                roomService.updateStatus(1L, "AVAILABLE")
        );
    }

    @Test
    void shouldNotDeleteOccupiedRoom() {
        room.setStatus(RoomStatus.OCCUPIED);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        assertThrows(CannotDeleteException.class, () ->
                roomService.delete(1L)
        );
    }

    @Test
    void shouldDeleteAvailableRoom() {
        room.setStatus(RoomStatus.AVAILABLE);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        roomService.delete(1L);

        verify(roomRepository, times(1)).delete(room);
    }

    @Test
    void shouldThrowIfRoomNotFound() {
        when(roomRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                roomService.delete(1L)
        );
    }
}
