package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestReservationServiceImpl implements GuestReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;

    @Override
    public List<GuestReservationSummaryDto> getGuestReservations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Guest authentication required");
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            throw new AccessDeniedException("Authenticated guest email is missing");
        }

        Guest guest = guestRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Guest profile not found for authenticated user: " + email));

        LocalDate today = LocalDate.now();

        return reservationRepository.findByGuest_Id(guest.getId()).stream()
                .sorted(buildReservationSort(today))
                .map(this::mapToDto)
                .toList();
    }

    private Comparator<Reservation> buildReservationSort(LocalDate today) {
        return Comparator
                .comparing((Reservation reservation) -> isOlderStay(reservation, today))
                .thenComparing(
                        reservation -> isOlderStay(reservation, today)
                                ? null
                                : reservation.getCheckInDate(),
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(
                        reservation -> isOlderStay(reservation, today)
                                ? reservation.getCheckOutDate()
                                : null,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(Reservation::getConfirmationNumber, Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private boolean isOlderStay(Reservation reservation, LocalDate today) {
        return reservation.getCheckOutDate() != null
                && reservation.getCheckOutDate().isBefore(today);
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
                // field name matches entity and frontend contract
                reservation.getTotalPrice() != null ? reservation.getTotalPrice() : BigDecimal.ZERO,
                reservation.getPaymentStatus() != null ? reservation.getPaymentStatus().name() : null,
                reservation.getInvoiceNumber(),
                reservation.isInvoiceFinalized(),
                reservation.getTotalPaid() != null ? reservation.getTotalPaid() : BigDecimal.ZERO,
                reservation.getOutstandingBalance() != null ? reservation.getOutstandingBalance() : BigDecimal.ZERO
        );
    }
}
