package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationLookupResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Focused, read-only service for staff reservation lookup.
 * Accepts either a confirmation number or a guest name.
 */
@Service
@Transactional(readOnly = true)
public class ReservationLookupService {

    private final ReservationRepository reservationRepository;
    private final ReservationFinancialService financialService;

    public ReservationLookupService(
            ReservationRepository reservationRepository,
            ReservationFinancialService financialService) {
        this.reservationRepository = reservationRepository;
        this.financialService = financialService;
    }

    /**
     * Look up a reservation by confirmation number or guest name.
     * Confirmation lookup is exact and case-insensitive.
     * Guest-name lookup is partial and case-insensitive:
     * zero matches -> 404, one match -> return it, many matches -> 409.
     */
    public ReservationLookupResponse search(String confirmation, String guestName) {
        Reservation reservation;

        if (confirmation != null && !confirmation.isBlank()) {
            String normalized = confirmation.trim().toUpperCase(Locale.ROOT);
            reservation = reservationRepository
                    .findByConfirmationNumber(normalized)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Reservation not found with confirmation number: " + confirmation));
        } else if (guestName != null && !guestName.isBlank()) {
            String normalizedGuestName = guestName.trim();
            List<Reservation> results = reservationRepository
                    .findAllByOptionalFilters(null, normalizedGuestName, null, null, null);

            if (results.isEmpty()) {
                throw new ResourceNotFoundException(
                        "No reservation found for guest name: " + guestName);
            }

            if (results.size() > 1) {
                throw new ResourceConflictException(
                        "Multiple reservations found for guest name: "
                                + guestName
                                + ". Use the reservation list filters or a confirmation number to select the exact stay.");
            }

            reservation = results.get(0);
        } else {
            throw new IllegalArgumentException(
                    "At least one search parameter is required: 'confirmation' or 'guestName'");
        }

        return toResponse(reservation);
    }

    private ReservationLookupResponse toResponse(Reservation reservation) {
        ReservationFinancialService.ReservationFinancialSummary summary =
                financialService.summarize(reservation);

        ReservationLookupResponse.RoomInfo roomInfo = new ReservationLookupResponse.RoomInfo(
                reservation.getRoom().getId(),
                reservation.getRoom().getRoomNumber(),
                reservation.getRoom().getFloor(),
                reservation.getRoom().getRoomType().getName(),
                reservation.getRoom().getRoomType().getMaxGuests(),
                reservation.getRoom().getRoomType().getAmenities());

        ReservationLookupResponse.DateInfo dateInfo = new ReservationLookupResponse.DateInfo(
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                summary.nights());

        ReservationLookupResponse.GuestInfo guestInfo = new ReservationLookupResponse.GuestInfo(
                reservation.getGuest().getId(),
                reservation.getGuest().getName(),
                reservation.getGuest().getEmail(),
                reservation.getGuest().getPhone(),
                reservation.getGuest().getIdNumber(),
                reservation.getGuest().getNationality());

        ReservationLookupResponse.PricingInfo pricingInfo = new ReservationLookupResponse.PricingInfo(
                summary.roomRate(),
                summary.subtotal(),
                summary.taxes(),
                summary.totalPrice());

        return new ReservationLookupResponse(
                reservation.getConfirmationNumber(),
                reservation.getStatus(),
                roomInfo,
                dateInfo,
                guestInfo,
                pricingInfo);
    }
}
