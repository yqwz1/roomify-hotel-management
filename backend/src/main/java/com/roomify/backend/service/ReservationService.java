package com.roomify.backend.service;

import com.roomify.backend.dto.*;
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
        reservation.setStatus(ReservationStatus.PENDING);
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

        if (request.getCheckInDate() != null) {
            reservation.setCheckInDate(request.getCheckInDate());
        }

        if (request.getCheckOutDate() != null) {
            reservation.setCheckOutDate(request.getCheckOutDate());
        }

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

    public ReservationResponse checkIn(String confirmationNumber) {

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(
                        confirmationNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        Room room = reservation.getRoom();

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResourceConflictException("Room not ready");
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
                reservation.getCheckOutDate());

        BigDecimal rate = room.getRoomType()
                .getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal subtotal = rate.multiply(BigDecimal.valueOf(nights));
        BigDecimal taxes = subtotal.multiply(taxRate);

        return toResponse(reservation, nights, rate, subtotal, taxes);
    }

    // =============================
    // GET BY CONFIRMATION NUMBER
    // =============================

    public ReservationResponse getByConfirmationNumber(String confirmationNumber) {

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(confirmationNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

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
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
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
