package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationLookupResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

/**
 * Focused, read-only service for the staff reservation lookup feature.
 * Accepts either a confirmation number or a guest name (at least one required).
 *
 * <ul>
 * <li>If {@code confirmation} is provided → exact match (case-insensitive). 404
 * if not found.</li>
 * <li>If only {@code guestName} is provided → partial, case-insensitive match.
 * Returns the first
 * result. 404 if no match.</li>
 * <li>If <em>both</em> are blank → 400 Bad Request (via
 * {@link IllegalArgumentException}).</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class ReservationLookupService {

    private static final int MONEY_SCALE = 2;

    private final ReservationRepository reservationRepository;
    private final BigDecimal taxRate;

    public ReservationLookupService(
            ReservationRepository reservationRepository,
            @Value("${roomify.reservations.tax-rate:0.10}") BigDecimal taxRate) {
        this.reservationRepository = reservationRepository;
        this.taxRate = taxRate;
    }

    /**
     * Look up a reservation by confirmation number OR guest name.
     *
     * @param confirmation exact confirmation number (e.g. "RSV-XXXXXXXXXXXX"), may
     *                     be blank
     * @param guestName    partial guest name (case-insensitive), may be blank
     * @return a fully-populated {@link ReservationLookupResponse} for the check-in
     *         UI
     * @throws IllegalArgumentException  if both parameters are blank (→ 400)
     * @throws ResourceNotFoundException if no matching reservation is found (→ 404)
     */
    public ReservationLookupResponse search(String confirmation, String guestName) {
        boolean hasConfirmation = confirmation != null && !confirmation.isBlank();
        boolean hasGuestName = guestName != null && !guestName.isBlank();

        if (!hasConfirmation && !hasGuestName) {
            throw new IllegalArgumentException(
                    "At least one search parameter is required: 'confirmation' or 'guestName'");
        }

        Reservation reservation;

        if (hasConfirmation) {
            String normalised = confirmation.trim().toUpperCase(Locale.ROOT);
            reservation = reservationRepository
                    .findByConfirmationNumber(normalised)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Reservation not found with confirmation number: " + confirmation));
        } else {
            List<Reservation> results = reservationRepository.findByGuestNameContainingIgnoreCase(guestName.trim());
            if (results.isEmpty()) {
                throw new ResourceNotFoundException(
                        "No reservation found for guest name: " + guestName);
            }
            reservation = results.get(0);
        }

        return toResponse(reservation);
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private ReservationLookupResponse toResponse(Reservation r) {
        long nights = ChronoUnit.DAYS.between(r.getCheckInDate(), r.getCheckOutDate());

        BigDecimal roomRate = r.getRoom().getRoomType().getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal subtotal = roomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxes = subtotal.multiply(taxRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalPrice = subtotal.add(taxes).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        ReservationLookupResponse.RoomInfo roomInfo = new ReservationLookupResponse.RoomInfo(
                r.getRoom().getId(),
                r.getRoom().getRoomNumber(),
                r.getRoom().getFloor(),
                r.getRoom().getRoomType().getName(),
                r.getRoom().getRoomType().getMaxGuests(),
                r.getRoom().getRoomType().getAmenities());

        ReservationLookupResponse.DateInfo dateInfo = new ReservationLookupResponse.DateInfo(
                r.getCheckInDate(),
                r.getCheckOutDate(),
                nights);

        ReservationLookupResponse.GuestInfo guestInfo = new ReservationLookupResponse.GuestInfo(
                r.getGuest().getId(),
                r.getGuest().getName(),
                r.getGuest().getEmail(),
                r.getGuest().getPhone(),
                r.getGuest().getIdNumber(),
                r.getGuest().getNationality());

        ReservationLookupResponse.PricingInfo pricingInfo = new ReservationLookupResponse.PricingInfo(
                roomRate, subtotal, taxes, totalPrice);

        return new ReservationLookupResponse(
                r.getConfirmationNumber(),
                r.getStatus(),
                roomInfo,
                dateInfo,
                guestInfo,
                pricingInfo);
    }
}
