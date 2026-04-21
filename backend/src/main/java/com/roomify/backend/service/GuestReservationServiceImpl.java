package com.roomify.backend.service;

import com.roomify.backend.dto.GuestProfileResponse;
import com.roomify.backend.dto.GuestProfileUpdateRequest;
import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GuestReservationServiceImpl implements GuestReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final ReservationService reservationService;

    @Override
    @Transactional(readOnly = true)
    public GuestProfileResponse getGuestProfile() {
        Guest guest = getPrimaryGuest();
        String email = getAuthenticatedEmail();

        if (guest == null) {
            return new GuestProfileResponse("", email, "", "", "");
        }

        return mapProfile(guest, email);
    }

    @Override
    public GuestProfileResponse updateGuestProfile(GuestProfileUpdateRequest request) {
        String email = getAuthenticatedEmail();
        Guest guest = getPrimaryGuest();
        String normalizedIdNumber = trimToEmpty(request.getIdNumber());

        guestRepository.findByIdNumber(normalizedIdNumber)
                .filter(existing -> guest == null || !existing.getId().equals(guest.getId()))
                .ifPresent(existing -> {
                    throw new ResourceConflictException("Guest ID number is already in use");
                });

        Guest target = guest != null ? guest : new Guest();
        target.setEmail(email);
        target.setName(trimToEmpty(request.getName()));
        target.setPhone(trimToEmpty(request.getPhone()));
        target.setIdNumber(normalizedIdNumber);
        target.setNationality(trimToEmpty(request.getNationality()));

        Guest saved = guestRepository.save(target);
        return mapProfile(saved, email);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GuestReservationSummaryDto> getGuestReservations() {
        LocalDate today = LocalDate.now();

        return getAuthenticatedGuests().stream()
                .map(Guest::getId)
                .flatMap(guestId -> reservationRepository.findByGuest_Id(guestId).stream())
                .filter(distinctByReservationId())
                .sorted(buildReservationSort(today))
                .map(this::mapToDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getGuestReservation(String confirmationNumber) {
        Reservation reservation = findOwnedReservation(confirmationNumber);
        return reservationService.getByConfirmationNumber(reservation.getConfirmationNumber());
    }

    @Override
    public ReservationResponse createGuestReservation(ReservationCreateRequest request) {
        String email = getAuthenticatedEmail();
        Guest guest = getPrimaryGuest();
        ReservationGuestRequest requestGuest = request.getGuest();

        if (requestGuest == null) {
            throw new ResourceConflictException("Guest details are required");
        }

        ReservationGuestRequest effectiveGuest = new ReservationGuestRequest(
                firstNonBlank(requestGuest.getName(), guest != null ? guest.getName() : null),
                email,
                firstNonBlank(requestGuest.getPhone(), guest != null ? guest.getPhone() : null),
                firstNonBlank(requestGuest.getIdNumber(), guest != null ? guest.getIdNumber() : null),
                firstNonBlank(requestGuest.getNationality(), guest != null ? guest.getNationality() : null));

        validateGuestProfileForBooking(effectiveGuest);

        ReservationCreateRequest effectiveRequest = new ReservationCreateRequest(
                request.getRoomId(),
                request.getCheckInDate(),
                request.getCheckOutDate(),
                request.getStatus() != null ? request.getStatus() : ReservationStatus.CONFIRMED,
                effectiveGuest);

        return reservationService.create(effectiveRequest);
    }

    @Override
    public ReservationActionPlaceholderResponse modifyGuestReservation(
            String confirmationNumber,
            ReservationModifyRequest request) {
        Reservation reservation = findOwnedReservation(confirmationNumber);
        return reservationService.modify(reservation.getId(), request);
    }

    @Override
    public ReservationActionPlaceholderResponse cancelGuestReservation(
            String confirmationNumber,
            ReservationCancelRequest request) {
        Reservation reservation = findOwnedReservation(confirmationNumber);
        ReservationCancelRequest effectiveRequest = request != null ? request : new ReservationCancelRequest();
        return reservationService.cancel(reservation.getId(), effectiveRequest);
    }

    private Reservation findOwnedReservation(String confirmationNumber) {
        String normalizedConfirmation = normalizeConfirmationNumber(confirmationNumber);

        Reservation reservation = reservationRepository.findByConfirmationNumber(normalizedConfirmation)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        Set<Long> guestIds = getAuthenticatedGuests().stream()
                .map(Guest::getId)
                .collect(java.util.stream.Collectors.toSet());

        if (reservation.getGuest() == null
                || reservation.getGuest().getId() == null
                || !guestIds.contains(reservation.getGuest().getId())) {
            throw new AccessDeniedException("You do not have access to this reservation");
        }

        return reservation;
    }

    private List<Guest> getAuthenticatedGuests() {
        String email = getAuthenticatedEmail();

        return guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc(email);
    }

    private Guest getPrimaryGuest() {
        List<Guest> guests = getAuthenticatedGuests();
        return guests.isEmpty() ? null : guests.get(0);
    }

    private String getAuthenticatedEmail() {
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
        if (confirmationNumber == null || confirmationNumber.isBlank()) {
            throw new IllegalArgumentException("Confirmation number is required");
        }
        return confirmationNumber.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String firstNonBlank(String first, String second) {
        String firstValue = normalizeOptional(first);
        if (firstValue != null) {
            return firstValue;
        }

        String secondValue = normalizeOptional(second);
        if (secondValue != null) {
            return secondValue;
        }

        return "";
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void validateGuestProfileForBooking(ReservationGuestRequest guest) {
        if (normalizeOptional(guest.getName()) == null
                || normalizeOptional(guest.getPhone()) == null
                || normalizeOptional(guest.getIdNumber()) == null
                || normalizeOptional(guest.getNationality()) == null) {
            throw new ResourceConflictException(
                    "Guest profile must be completed before creating a reservation");
        }
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
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(
                        reservation -> isPastStay(reservation, today) ? reservation.getCheckOutDate() : null,
                        Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(
                        Reservation::getConfirmationNumber,
                        Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private boolean isPastStay(Reservation reservation, LocalDate today) {
        return reservation.getCheckOutDate() != null
                && reservation.getCheckOutDate().isBefore(today);
    }

    private GuestProfileResponse mapProfile(Guest guest, String email) {
        return new GuestProfileResponse(
                guest.getName(),
                email,
                guest.getPhone(),
                guest.getIdNumber(),
                guest.getNationality());
    }

    private GuestReservationSummaryDto mapToDto(Reservation reservation) {
        String roomNumber = null;
        String roomTypeName = null;

        if (reservation.getRoom() != null) {
            roomNumber = reservation.getRoom().getRoomNumber();

            if (reservation.getRoom().getRoomType() != null) {
                roomTypeName = reservation.getRoom().getRoomType().getName();
            }
        }

        return new GuestReservationSummaryDto(
                reservation.getConfirmationNumber(),
                reservation.getStatus() != null ? reservation.getStatus().name() : null,
                roomNumber,
                roomTypeName,
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                reservation.getTotalPrice() != null ? reservation.getTotalPrice() : BigDecimal.ZERO,
                reservation.getPaymentStatus() != null ? reservation.getPaymentStatus().name() : null,
                reservation.getInvoiceNumber(),
                reservation.isInvoiceFinalized(),
                reservation.getTotalPaid() != null ? reservation.getTotalPaid() : BigDecimal.ZERO,
                reservation.getOutstandingBalance() != null ? reservation.getOutstandingBalance() : BigDecimal.ZERO);
    }
}
