package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.exception.EmailDeliveryException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ReservationService {

    private static final int MONEY_SCALE = 2;
    private static final int CONFIRMATION_MAX_ATTEMPTS = 10;

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;
    private final EmailService emailService;
    private final AuditService auditService;
    private final BigDecimal taxRate;

    public ReservationService(
            ReservationRepository reservationRepository,
            GuestRepository guestRepository,
            RoomRepository roomRepository,
            EmailService emailService,
            AuditService auditService,
            @Value("${roomify.reservations.tax-rate:0.10}") BigDecimal taxRate) {

        this.reservationRepository = reservationRepository;
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
        this.emailService = emailService;
        this.auditService = auditService;
        this.taxRate = taxRate;
    }

    // ========================= CREATE =========================

    public ReservationResponse create(ReservationCreateRequest request) {

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));

        long nights = ChronoUnit.DAYS.between(
                request.getCheckInDate(),
                request.getCheckOutDate());

        if (nights <= 0) {
            throw new ResourceConflictException("Check-out date must be after check-in date");
        }

        if (!reservationRepository.findOverlappingReservations(
                request.getRoomId(),
                request.getCheckInDate(),
                request.getCheckOutDate()).isEmpty()) {
            throw new ResourceConflictException("Room is already booked for the selected dates");
        }

        BigDecimal roomRate = room.getRoomType().getBasePrice();
        if (roomRate == null) {
            throw new ResourceConflictException(
                    "Room type price is not configured for room type id: "
                            + room.getRoomType().getId());
        }

        Guest guest = resolveOrCreateGuest(request.getGuest());

        BigDecimal normalizedRoomRate = roomRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = normalizedRoomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxes = subtotal.multiply(taxRate)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal totalPrice = subtotal.add(taxes)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        Reservation reservation = new Reservation();
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setCheckInDate(request.getCheckInDate());
        reservation.setCheckOutDate(request.getCheckOutDate());
        reservation.setStatus(
                request.getStatus() != null
                        ? request.getStatus()
                        : ReservationStatus.PENDING);
        reservation.setTotalPrice(totalPrice);
        reservation.setConfirmationNumber(generateUniqueConfirmationNumber());

        Reservation savedReservation = reservationRepository.save(reservation);

        ReservationResponse response = toResponse(savedReservation, nights,
                normalizedRoomRate, subtotal, taxes);

        sendReservationConfirmationEmail(savedReservation, response);

        return response;
    }

    // ========================= CHECK-IN =========================

    public ReservationResponse checkIn(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with id: " + reservationId));

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException(
                    "Only CONFIRMED reservations can be checked in");
        }

        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservationRepository.save(reservation);

        // ✅ Audit Log
        auditService.log(
                "CHECK_IN",
                "Reservation#" + reservation.getId(),
                "reservationId=" + reservation.getId()
                        + ", roomId=" + reservation.getRoom().getId());

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(),
                reservation.getCheckOutDate());

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice();

        BigDecimal normalizedRoomRate = roomRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = normalizedRoomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxes = subtotal.multiply(taxRate)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return toResponse(reservation, nights,
                normalizedRoomRate, subtotal, taxes);
    }

    // ========================= GET BY CONFIRMATION =========================

    @Transactional(readOnly = true)
    public ReservationResponse getByConfirmationNumber(String confirmationNumber) {

        Reservation reservation = reservationRepository.findByConfirmationNumber(
                normalizeConfirmationNumber(confirmationNumber))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: "
                                + confirmationNumber));

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(),
                reservation.getCheckOutDate());

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice();

        BigDecimal normalizedRoomRate = roomRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = normalizedRoomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxes = subtotal.multiply(taxRate)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return toResponse(reservation, nights,
                normalizedRoomRate, subtotal, taxes);
    }

    // ========================= PRIVATE METHODS =========================

    private Guest resolveOrCreateGuest(ReservationGuestRequest request) {

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedIdNumber = request.getIdNumber().trim();

        Optional<Guest> guestByEmail = guestRepository.findByEmailIgnoreCase(normalizedEmail);

        Optional<Guest> guestByIdNumber = guestRepository.findByIdNumber(normalizedIdNumber);

        Guest resolvedGuest = guestByEmail.orElseGet(() -> guestByIdNumber.orElse(null));

        if (resolvedGuest != null) {
            resolvedGuest.setName(request.getName().trim());
            resolvedGuest.setEmail(normalizedEmail);
            resolvedGuest.setPhone(request.getPhone().trim());
            resolvedGuest.setIdNumber(normalizedIdNumber);
            resolvedGuest.setNationality(request.getNationality().trim());
            return guestRepository.save(resolvedGuest);
        }

        Guest newGuest = new Guest(
                request.getName().trim(),
                normalizedEmail,
                request.getPhone().trim(),
                normalizedIdNumber,
                request.getNationality().trim());

        return guestRepository.save(newGuest);
    }

    private String generateUniqueConfirmationNumber() {
        for (int i = 0; i < CONFIRMATION_MAX_ATTEMPTS; i++) {
            String candidate = "RSV-" + UUID.randomUUID().toString()
                    .replace("-", "")
                    .substring(0, 12)
                    .toUpperCase(Locale.ROOT);

            if (!reservationRepository.existsByConfirmationNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException(
                "Unable to generate a unique confirmation number");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeConfirmationNumber(String confirmationNumber) {
        if (confirmationNumber == null || confirmationNumber.isBlank()) {
            throw new IllegalArgumentException("Confirmation number is required");
        }
        return confirmationNumber.trim().toUpperCase(Locale.ROOT);
    }

    private void sendReservationConfirmationEmail(
            Reservation reservation,
            ReservationResponse response) {

        try {
            emailService.sendReservationConfirmationEmail(
                    reservation.getGuest().getEmail(),
                    reservation.getGuest().getName(),
                    response);
        } catch (MailException ex) {
            throw new EmailDeliveryException(
                    "Failed to send reservation confirmation email. Please try again.",
                    ex);
        }
    }

    private ReservationResponse toResponse(
            Reservation reservation,
            long nights,
            BigDecimal roomRate,
            BigDecimal subtotal,
            BigDecimal taxes) {

        return new ReservationResponse(
                reservation.getId(),
                reservation.getConfirmationNumber(),
                reservation.getStatus(),
                reservation.getRoom().getId(),
                reservation.getRoom().getRoomNumber(),
                reservation.getGuest().getId(),
                reservation.getGuest().getName(),
                reservation.getGuest().getEmail(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                nights,
                roomRate,
                subtotal,
                taxes,
                reservation.getTotalPrice());
    }
}