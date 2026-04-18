package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class GuestReservationServiceImpl implements GuestReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;

    @Override
    public List<GuestReservationSummaryDto> getGuestReservations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found in the security context.");
        }

        String email = authentication.getName();

        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("Authenticated user identity could not be resolved: email is missing.");
        }

        Guest guest = guestRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Guest profile not found for authenticated user: " + email));

        List<Reservation> reservations = reservationRepository.findByGuest_Id(guest.getId());

        return reservations.stream()
                .map(this::mapToDto)
                .toList();
    }

    private GuestReservationSummaryDto mapToDto(Reservation reservation) {
        String roomNumber = null;
        String roomType = null;

        if (reservation.getRoom() != null) {
            roomNumber = reservation.getRoom().getRoomNumber();

            if (reservation.getRoom().getRoomType() != null) {
                roomType = reservation.getRoom().getRoomType().getName();
            }
        }

        return new GuestReservationSummaryDto(
                reservation.getConfirmationNumber(),
                reservation.getStatus() != null ? reservation.getStatus().name() : null,
                roomNumber,
                roomType,
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                // totalAmount is the API contract name; populated from entity field totalPrice
                reservation.getTotalPrice() != null ? reservation.getTotalPrice() : BigDecimal.ZERO,
                reservation.getPaymentStatus() != null ? reservation.getPaymentStatus().name() : null,
                reservation.getInvoiceNumber(),
                reservation.isInvoiceFinalized(),
                reservation.getTotalPaid() != null ? reservation.getTotalPaid() : BigDecimal.ZERO,
                reservation.getOutstandingBalance() != null ? reservation.getOutstandingBalance() : BigDecimal.ZERO
        );
    }
}