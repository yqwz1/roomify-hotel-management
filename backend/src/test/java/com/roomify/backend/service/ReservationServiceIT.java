package com.roomify.backend.service;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.exception.BookingConflictException;
import com.roomify.backend.repository.RoomRepository;

@SpringBootTest
@Transactional
class ReservationServiceIT {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private RoomRepository roomRepository;

    @Test
    void shouldThrowExceptionWhenBookingOverlaps() {
        // 1. Setup: Create and save a room
        Room room = new Room(); // Assuming Wahib created Room entity
        room = roomRepository.save(room);

        // 2. Create an existing reservation
        Reservation existing = new Reservation();
        existing.setRoom(room);
        existing.setCheckInDate(LocalDate.of(2026, 3, 10));
        existing.setCheckOutDate(LocalDate.of(2026, 3, 15));
        existing.setStatus(ReservationStatus.CONFIRMED);
        reservationService.createReservation(existing);

        // 3. Try to create an overlapping reservation (should fail)
        Reservation overlapping = new Reservation();
        overlapping.setRoom(room);
        overlapping.setCheckInDate(LocalDate.of(2026, 3, 12)); // Overlaps!
        overlapping.setCheckOutDate(LocalDate.of(2026, 3, 18));

        // 4. Assert that it throws BookingConflictException (409)
        assertThrows(BookingConflictException.class, () -> {
            reservationService.createReservation(overlapping);
        });
    }
}