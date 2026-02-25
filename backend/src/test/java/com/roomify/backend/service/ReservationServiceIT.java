package com.roomify.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;

@SpringBootTest
@Transactional
class ReservationServiceIT {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Test
    void shouldThrowExceptionWhenBookingOverlaps() {
        // 1. Setup: Create and save a room type + room
        RoomType roomType = roomTypeRepository.save(
                new RoomType("Standard", new BigDecimal("100.00"), 2, "WiFi", "Standard room"));
        Room room = roomRepository.save(new Room("101", roomType, 1, RoomStatus.AVAILABLE));

        ReservationGuestRequest guestRequest = new ReservationGuestRequest(
                "Test Guest", "test@example.com", "+966500000000", "ID12345", "Saudi");

        // 2. Create an existing reservation via the service
        ReservationCreateRequest existing = new ReservationCreateRequest(
                room.getId(),
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 15),
                null,
                guestRequest);
        reservationService.create(existing);

        // 3. Try to create an overlapping reservation (should fail)
        ReservationCreateRequest overlapping = new ReservationCreateRequest(
                room.getId(),
                LocalDate.of(2026, 3, 12), // Overlaps!
                LocalDate.of(2026, 3, 18),
                null,
                guestRequest);

        // 4. Assert that booking conflict is detected
        assertThrows(ResourceConflictException.class, () -> reservationService.create(overlapping));
    }
}