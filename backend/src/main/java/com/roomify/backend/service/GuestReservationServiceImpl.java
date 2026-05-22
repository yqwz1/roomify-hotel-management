package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import java.math.BigDecimal;
import java.util.HashSet;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuestReservationServiceImpl implements GuestReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final ReservationService reservationService;

    @Override
    public List<GuestReservationSummaryDto> getGuestReservations() {
        LocalDate today = LocalDate.now();

        return resolveAuthenticatedGuests().stream()
                .map(Guest::getId)
                .flatMap(guestId -> reservationRepository.findByGuest_Id(guestId).stream())
                .filter(distinctByReservationId())
                .sorted(buildReservationSort(today))
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public ReservationResponse createAuthenticatedGuestReservation(ReservationCreateRequest request) {
        String email = requireAuthenticatedEmail();
        return reservationService.createForAuthenticatedGuest(request, email);
    }

    @Override
    public void assertGuestOwnsReservation(String confirmationNumber) {
        String normalizedConfirmation = normalizeConfirmationNumber(confirmationNumber);

        boolean ownsReservation = resolveAuthenticatedGuests().stream()
                .map(Guest::getId)
                .flatMap(guestId -> reservationRepository.findByGuest_Id(guestId).stream())
                .anyMatch(reservation -> normalizedConfirmation.equals(
                        normalizeConfirmationNumber(reservation.getConfirmationNumber())));

        if (!ownsReservation) {
            throw new AccessDeniedException("Reservation access denied for authenticated guest");
        }
    }

    @Override
    public List<Long> getAuthenticatedGuestIds() {
        return resolveAuthenticatedGuests().stream()
                .map(Guest::getId)
                .toList();
    }

    @Override
    public Reservation requireActiveGuestReservationForRoom(Long roomId) {
        LocalDate today = LocalDate.now();

        return resolveAuthenticatedGuests().stream()
                .map(Guest::getId)
                .flatMap(guestId -> reservationRepository.findByGuest_Id(guestId).stream())
                .filter(this::hasAssignedRoom)
                .filter(reservation -> roomId.equals(reservation.getRoomId()))
                .filter(reservation -> isActiveReservation(reservation, today))
                .sorted(buildReservationSort(today))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Selected room is not part of an active reservation."));
    }

    private List<Guest> resolveAuthenticatedGuests() {
        String email = requireAuthenticatedEmail();

        // Some legacy datasets can contain case-variant guest rows for the same
        // logical email. We merge them so the authenticated guest still sees a
        // complete reservation history without any frontend workaround.
        List<Guest> guests = guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc(email);
        if (guests.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Guest profile not found for authenticated user: " + email);
        }

        return guests;
    }

    private String requireAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Guest authentication required");
        }

        String email = normalizeEmail(authentication.getName());
        if (email == null || email.isBlank()) {
            throw new AccessDeniedException("Authenticated guest email is missing");
        }
        return email;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalized = email.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeConfirmationNumber(String confirmationNumber) {
        if (confirmationNumber == null) {
            return null;
        }
        String normalized = confirmationNumber.trim().toUpperCase();
        return normalized.isEmpty() ? null : normalized;
    }

    private Predicate<Reservation> distinctByReservationId() {
        Set<Long> seenIds = new HashSet<>();
        return reservation -> reservation.getId() == null || seenIds.add(reservation.getId());
    }

    private Comparator<Reservation> buildReservationSort(LocalDate today) {
        return Comparator
                .comparing((Reservation reservation) -> isPastStay(reservation, today))
                .thenComparing(
                        reservation -> isPastStay(reservation, today) ? null : reservation.getCheckInDate(),
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(
                        reservation -> isPastStay(reservation, today) ? reservation.getCheckOutDate() : null,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(
                        Reservation::getConfirmationNumber,
                        Comparator.nullsLast(Comparator.naturalOrder())
                );
    }

    private boolean isPastStay(Reservation reservation, LocalDate today) {
        return reservation.getCheckOutDate() != null
                && reservation.getCheckOutDate().isBefore(today);
    }

    private boolean isActiveReservation(Reservation reservation, LocalDate today) {
        if (!hasAssignedRoom(reservation) || reservation.getCheckOutDate() == null) {
            return false;
        }

        ReservationStatus status = reservation.getStatus();
        if (status != ReservationStatus.CONFIRMED && status != ReservationStatus.CHECKED_IN) {
            return false;
        }

        return !reservation.getCheckOutDate().isBefore(today);
    }

    private boolean hasAssignedRoom(Reservation reservation) {
        return reservation.getRoom() != null && reservation.getRoom().getId() != null;
    }

    private GuestReservationSummaryDto mapToDto(Reservation reservation) {
        Long roomId = null;
        String roomNumber = null;
        String roomTypeName = null;

        if (reservation.getRoom() != null) {
            roomId = reservation.getRoom().getId();
            roomNumber = reservation.getRoom().getRoomNumber();

            if (reservation.getRoom().getRoomType() != null) {
                roomTypeName = reservation.getRoom().getRoomType().getName();
            }
        }

        return new GuestReservationSummaryDto(
                reservation.getConfirmationNumber(),
                reservation.getStatus() != null ? reservation.getStatus().name() : null,
                roomId,
                roomNumber,
                roomTypeName,
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                reservation.getTotalPrice() != null ? reservation.getTotalPrice() : BigDecimal.ZERO,
                reservation.getPaymentStatus() != null ? reservation.getPaymentStatus().name() : null,
                reservation.getInvoiceNumber(),
                reservation.isInvoiceFinalized(),
                reservation.getTotalPaid() != null ? reservation.getTotalPaid() : BigDecimal.ZERO,
                reservation.getOutstandingBalance() != null ? reservation.getOutstandingBalance() : BigDecimal.ZERO
        );
    }
}
