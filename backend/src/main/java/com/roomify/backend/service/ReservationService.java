package com.roomify.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.BookingConflictException;
import com.roomify.backend.repository.ReservationRepository;

/**
 * Service class handling reservation logic and business rules.
 * Implements D2: Prevent Double-Booking.
 */
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    
    @Transactional
    public Reservation createReservation(Reservation reservation) {
        // Step 1: Add overlap check before insert
        // Using findOverlappingReservations which triggers a PESSIMISTIC_WRITE lock
        List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
                reservation.getRoom().getId(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate()
        );

        if (!overlaps.isEmpty()) {
            // Step 2: Return 409 Conflict if overlap exists
            throw new BookingConflictException("The room is already booked for the selected dates.");
        }

        // Step 3: Proceed with saving if no conflicts are found
        return reservationRepository.save(reservation);
    }

    /**
     * Updates an existing reservation (Modify path).
     */
    @Transactional
    public Reservation updateReservation(Long id, Reservation updatedDetails) {
        // Verify the reservation exists
        Reservation existingReservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        // Check for overlaps excluding the current reservation ID
        List<Reservation> overlaps = reservationRepository.findOverlappingForUpdate(
                updatedDetails.getRoom().getId(),
                updatedDetails.getCheckInDate(),
                updatedDetails.getCheckOutDate(),
                id
        );

        if (!overlaps.isEmpty()) {
            throw new BookingConflictException("Updated dates conflict with an existing booking.");
        }

        // Update fields
        existingReservation.setCheckInDate(updatedDetails.getCheckInDate());
        existingReservation.setCheckOutDate(updatedDetails.getCheckOutDate());
        existingReservation.setStatus(updatedDetails.getStatus());
        
        return reservationRepository.save(existingReservation);
    }
}