package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCheckInRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
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
import java.time.LocalDateTime;
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

    public ReservationResponse create(ReservationCreateRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));

        long nights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
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
                    "Room type price is not configured for room type id: " + room.getRoomType().getId());
        }

        Guest guest = resolveOrCreateGuest(request.getGuest());

        BigDecimal normalizedRoomRate = roomRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal subtotal = normalizedRoomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxes = subtotal.multiply(taxRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalPrice = subtotal.add(taxes).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        Reservation reservation = new Reservation();
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setCheckInDate(request.getCheckInDate());
        reservation.setCheckOutDate(request.getCheckOutDate());
        reservation.setStatus(request.getStatus() != null ? request.getStatus() : ReservationStatus.PENDING);
        reservation.setTotalPrice(totalPrice);
        reservation.setConfirmationNumber(generateUniqueConfirmationNumber());

        Reservation savedReservation = reservationRepository.save(reservation);
        ReservationResponse response = toResponse(savedReservation, nights, normalizedRoomRate, subtotal, taxes);
        sendReservationConfirmationEmail(savedReservation, response);
        return response;
    }

    @Transactional(readOnly = true)
    public ReservationResponse getByConfirmationNumber(String confirmationNumber) {
        Reservation reservation = reservationRepository.findByConfirmationNumber(normalizeConfirmationNumber(confirmationNumber))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        long nights = ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate());
        if (nights <= 0) {
            throw new ResourceConflictException(
                    "Stored reservation has invalid date range for confirmation number: " + reservation.getConfirmationNumber());
        }

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice();
        if (roomRate == null) {
            throw new ResourceConflictException(
                    "Room type price is not configured for room type id: " + reservation.getRoom().getRoomType().getId());
        }

        BigDecimal normalizedRoomRate = roomRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal subtotal = normalizedRoomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxes = subtotal.multiply(taxRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return toResponse(reservation, nights, normalizedRoomRate, subtotal, taxes);
    }

    public ReservationActionPlaceholderResponse modify(Long id, ReservationModifyRequest request) {
        Reservation reservation = findReservationById(id);

        if (request.getCheckInDate() != null) {
            reservation.setCheckInDate(request.getCheckInDate());
        }
        if (request.getCheckOutDate() != null) {
            reservation.setCheckOutDate(request.getCheckOutDate());
        }
        reservation.setModificationReason(request.getModificationReason().trim());
        reservation.setModifiedAt(LocalDateTime.now());

        Reservation savedReservation = reservationRepository.save(reservation);
        return toPlaceholderResponse(
                savedReservation,
                "modify",
                "Modify reservation endpoint is scaffolded; full business rules are pending.");
    }

    public ReservationActionPlaceholderResponse cancel(Long id, ReservationCancelRequest request) {
        Reservation reservation = findReservationById(id);

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancellationReason(request.getCancellationReason().trim());
        reservation.setCancellationAt(LocalDateTime.now());
        reservation.setModifiedAt(LocalDateTime.now());

        Reservation savedReservation = reservationRepository.save(reservation);
        return toPlaceholderResponse(
                savedReservation,
                "cancel",
                "Cancel reservation endpoint is scaffolded; refund and policy rules are pending.");
    }

    public ReservationActionPlaceholderResponse checkIn(Long id, ReservationCheckInRequest request) {
        Reservation reservation = findReservationById(id);

        reservation.setActualCheckInDate(request.getActualCheckInDate());
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setModifiedAt(LocalDateTime.now());

        Reservation savedReservation = reservationRepository.save(reservation);
        return toPlaceholderResponse(
                savedReservation,
                "check-in",
                "Reservation check-in endpoint is scaffolded; occupancy workflow rules are pending.");
    }

    // ============================
    // CI0 — CHECK-IN LOGIC
    // ============================

    public ReservationResponse checkIn(String confirmationNumber) {

        String normalized = normalizeConfirmationNumber(confirmationNumber);

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(normalized)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Reservation not found with confirmation number: " + confirmationNumber
                        )
                );

        if (reservation.getStatus() == ReservationStatus.CHECKED_IN) {
            throw new ResourceConflictException("Reservation is already checked in");
        }

        Room room = reservation.getRoom();

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResourceConflictException(
                    "Room is not ready for check-in. Current status: " + room.getStatus()
            );
        }

        room.setStatus(RoomStatus.OCCUPIED);
        reservation.setStatus(ReservationStatus.CHECKED_IN);

        roomRepository.save(room);
        reservationRepository.save(reservation);

        auditService.log(
                "ROOM_STATUS_CHANGE",
                "Room",
                "Room " + room.getRoomNumber() + " status changed to OCCUPIED during check-in"
        );

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(),
                reservation.getCheckOutDate()
        );

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = roomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxes = subtotal.multiply(taxRate)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return toResponse(reservation, nights, roomRate, subtotal, taxes);
    }

    private Guest resolveOrCreateGuest(ReservationGuestRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedIdNumber = request.getIdNumber().trim();

        Optional<Guest> guestByEmail = guestRepository.findByEmailIgnoreCase(normalizedEmail);
        Optional<Guest> guestByIdNumber = guestRepository.findByIdNumber(normalizedIdNumber);

        if (guestByEmail.isPresent() && guestByIdNumber.isPresent()
                && !guestByEmail.get().getId().equals(guestByIdNumber.get().getId())) {
            throw new ResourceConflictException("Guest email and ID number belong to different guest records");
        }

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
        throw new IllegalStateException("Unable to generate a unique confirmation number");
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

    private Reservation findReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    private ReservationActionPlaceholderResponse toPlaceholderResponse(
            Reservation reservation,
            String action,
            String message) {
        return new ReservationActionPlaceholderResponse(
                reservation.getId(),
                action,
                message,
                true,
                reservation.getStatus());
    }

    private void sendReservationConfirmationEmail(Reservation reservation, ReservationResponse response) {
        try {
            emailService.sendReservationConfirmationEmail(
                    reservation.getGuest().getEmail(),
                    reservation.getGuest().getName(),
                    response);
        } catch (MailException ex) {
            throw new EmailDeliveryException("Failed to send reservation confirmation email. Please try again.", ex);
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