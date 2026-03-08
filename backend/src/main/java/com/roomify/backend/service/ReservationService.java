package com.roomify.backend.service;

import com.roomify.backend.dto.*;
import com.roomify.backend.dto.ReservationCheckInRequest;
import com.roomify.backend.entity.*;
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

    // =============================
    // CREATE RESERVATION
    // =============================

    public ReservationResponse create(ReservationCreateRequest request) {

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        long nights = ChronoUnit.DAYS.between(
                request.getCheckInDate(),
                request.getCheckOutDate());

        if (nights <= 0) {
            throw new ResourceConflictException("Check-out must be after check-in");
        }

        if (!reservationRepository.findOverlappingReservations(
                request.getRoomId(),
                request.getCheckInDate(),
                request.getCheckOutDate()).isEmpty()) {

            throw new ResourceConflictException("Room already booked for selected dates");
        }

        Guest guest = resolveOrCreateGuest(request.getGuest());

        BigDecimal roomRate = room.getRoomType()
                .getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = roomRate.multiply(BigDecimal.valueOf(nights))
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
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setTotalPrice(totalPrice);
        reservation.setConfirmationNumber(generateUniqueConfirmationNumber());

        Reservation saved = reservationRepository.save(reservation);

        ReservationResponse response = toResponse(saved, nights, roomRate, subtotal, taxes);

        sendReservationConfirmationEmail(saved, response);

        return response;
    }

    // =============================
    // MODIFY RESERVATION
    // =============================

    public ReservationActionPlaceholderResponse modify(Long id, ReservationModifyRequest request) {

        Reservation reservation = findReservationById(id);

        String oldRoom = reservation.getRoom().getRoomNumber();
        String oldCheckIn = reservation.getCheckInDate().toString();
        String oldCheckOut = reservation.getCheckOutDate().toString();

        java.time.LocalDate newCheckIn = request.getCheckInDate() != null ? request.getCheckInDate() : reservation.getCheckInDate();
        java.time.LocalDate newCheckOut = request.getCheckOutDate() != null ? request.getCheckOutDate() : reservation.getCheckOutDate();
        Long newRoomId = request.getRoomId() != null ? request.getRoomId() : reservation.getRoom().getId();

        if (ChronoUnit.DAYS.between(newCheckIn, newCheckOut) <= 0) {
            throw new ResourceConflictException("Check-out must be after check-in");
        }

        Room room = roomRepository.findById(newRoomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!reservationRepository.findOverlappingForUpdate(newRoomId, newCheckIn, newCheckOut, id).isEmpty()) {
            throw new ResourceConflictException("Room is not available for the selected dates");
        }

        reservation.setCheckInDate(newCheckIn);
        reservation.setCheckOutDate(newCheckOut);
        reservation.setRoom(room);

        long nights = ChronoUnit.DAYS.between(newCheckIn, newCheckOut);
        BigDecimal roomRate = room.getRoomType().getBasePrice().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal subtotal = roomRate.multiply(BigDecimal.valueOf(nights)).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxes = subtotal.multiply(taxRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalPrice = subtotal.add(taxes).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        reservation.setTotalPrice(totalPrice);

        reservation.setModificationReason(request.getModificationReason().trim());
        reservation.setModifiedAt(LocalDateTime.now());

        Reservation saved = reservationRepository.save(reservation);

        try {

            emailService.sendReservationModificationEmail(
                    reservation.getGuest().getEmail(),
                    oldRoom,
                    reservation.getRoom().getRoomNumber(),
                    oldCheckIn,
                    reservation.getCheckInDate().toString(),
                    oldCheckOut,
                    reservation.getCheckOutDate().toString(),
                    reservation.getTotalPrice().toString(),
                    reservation.getConfirmationNumber());

        } catch (MailException ex) {

            throw new EmailDeliveryException(
                    "Failed to send modification email", ex);
        }

        return toPlaceholderResponse(saved, "modify",
                "Reservation modified and email sent");
    }

    // =============================
    // CANCEL RESERVATION
    // =============================

    public ReservationActionPlaceholderResponse cancel(Long id, ReservationCancelRequest request) {

        Reservation reservation = findReservationById(id);

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancellationReason(request.getCancellationReason().trim());
        reservation.setCancellationAt(LocalDateTime.now());
        reservation.setModifiedAt(LocalDateTime.now());

        Reservation saved = reservationRepository.save(reservation);

        try {

            emailService.sendReservationCancellationEmail(
                    reservation.getGuest().getEmail(),
                    reservation.getGuest().getName(),
                    reservation.getRoom().getRoomNumber(),
                    reservation.getCheckInDate().toString(),
                    reservation.getCheckOutDate().toString(),
                    reservation.getTotalPrice().toString(),
                    reservation.getConfirmationNumber());

        } catch (MailException ex) {

            throw new EmailDeliveryException(
                    "Failed to send cancellation email", ex);
        }

        return toPlaceholderResponse(saved, "cancel",
                "Reservation cancelled and email sent");
    }

    // =============================
    // CHECK-IN
    // =============================

    public ReservationActionPlaceholderResponse checkIn(Long id, ReservationCheckInRequest request) {

        Reservation reservation = findReservationById(id);

        // 1. Reject terminal / already-processed statuses (→ 409)
        ReservationStatus status = reservation.getStatus();
        if (status == ReservationStatus.CANCELLED
                || status == ReservationStatus.CHECKED_IN
                || status == ReservationStatus.CHECKED_OUT) {
            throw new ResourceConflictException(
                    "Cannot check in: reservation status is " + status);
        }

        // 2. Actual date must not precede the scheduled check-in date (→ 409)
        if (request.getActualCheckInDate().isBefore(reservation.getCheckInDate())) {
            throw new ResourceConflictException(
                    "Actual check-in date cannot be before the scheduled check-in date");
        }

        // 3. Room must be AVAILABLE — Eyed's service will also handle room state,
        //    but we guard here so the reservation stays clean on failure (→ 409)
        Room room = reservation.getRoom();
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResourceConflictException("Room is not ready for check-in");
        }

        // 4. Perform the check-in
        room.setStatus(RoomStatus.OCCUPIED);
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setActualCheckInDate(request.getActualCheckInDate());

        roomRepository.save(room);
        reservationRepository.save(reservation);

        auditService.log(
                "ROOM_STATUS_CHANGE",
                "Room",
                "Room " + room.getRoomNumber() + " status changed to OCCUPIED during check-in");

        return toPlaceholderResponse(reservation, "check-in", "Guest checked in successfully");
    }

    // =============================
    // GET BY CONFIRMATION NUMBER
    // =============================

    public ReservationResponse getByConfirmationNumber(String confirmationNumber) {

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(confirmationNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with confirmation number: " + confirmationNumber));

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(),
                reservation.getCheckOutDate());

        BigDecimal rate = reservation.getRoom().getRoomType()
                .getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = rate.multiply(BigDecimal.valueOf(nights));
        BigDecimal taxes = subtotal.multiply(taxRate);

        return toResponse(reservation, nights, rate, subtotal, taxes);
    }

    // =============================
    // HELPERS
    // =============================

    private Guest resolveOrCreateGuest(ReservationGuestRequest request) {

        Optional<Guest> guest = guestRepository.findByEmailIgnoreCase(request.getEmail());

        if (guest.isPresent()) {
            return guest.get();
        }

        Guest newGuest = new Guest(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getIdNumber(),
                request.getNationality());

        return guestRepository.save(newGuest);
    }

    private String generateUniqueConfirmationNumber() {

        for (int i = 0; i < CONFIRMATION_MAX_ATTEMPTS; i++) {

            String number = "RSV-" +
                    UUID.randomUUID().toString()
                            .replace("-", "")
                            .substring(0, 10)
                            .toUpperCase();

            if (!reservationRepository.existsByConfirmationNumber(number)) {
                return number;
            }
        }

        throw new IllegalStateException("Unable to generate confirmation number");
    }

    private Reservation findReservationById(Long id) {

        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
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
                    "Failed to send confirmation email", ex);
        }
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

    private ReservationResponse toResponse(
            Reservation reservation,
            long nights,
            BigDecimal rate,
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
                rate,
                subtotal,
                taxes,
                reservation.getTotalPrice());
    }
}
