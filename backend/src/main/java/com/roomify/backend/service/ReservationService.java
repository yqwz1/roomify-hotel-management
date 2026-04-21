package com.roomify.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationFilterRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.exception.EmailDeliveryException;
import com.roomify.backend.exception.PaymentValidationException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;

@Service
@Transactional
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);
    private static final int MONEY_SCALE = 2;
    private static final int CONFIRMATION_MAX_ATTEMPTS = 10;

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;
    private final EmailService emailService;
    private final AuditService auditService;
    private final HousekeepingNotificationService housekeepingNotificationService;
    private final ReservationFinancialService financialService;
    private final InvoiceEmailService invoiceEmailService;
    private final InvoiceDeliveryLogService invoiceDeliveryLogService;
    private final HotelSettingsService hotelSettingsService;

    public ReservationService(
            ReservationRepository reservationRepository,
            GuestRepository guestRepository,
            RoomRepository roomRepository,
            EmailService emailService,
            InvoiceEmailService invoiceEmailService,
            InvoiceDeliveryLogService invoiceDeliveryLogService,
            AuditService auditService,
            HousekeepingNotificationService housekeepingNotificationService,
            ReservationFinancialService financialService,
            HotelSettingsService hotelSettingsService) {

        this.reservationRepository = reservationRepository;
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
        this.emailService = emailService;
        this.invoiceEmailService = invoiceEmailService;
        this.invoiceDeliveryLogService = invoiceDeliveryLogService;
        this.auditService = auditService;
        this.housekeepingNotificationService = housekeepingNotificationService;
        this.financialService = financialService;
        this.hotelSettingsService = hotelSettingsService;
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
        BigDecimal taxRate = hotelSettingsService.getTaxRate();

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
        ReservationStatus initialStatus = request.getStatus() != null
                ? request.getStatus()
                : ReservationStatus.PENDING;
        reservation.setStatus(initialStatus);
        reservation.setTotalPrice(totalPrice);
        reservation.setTotalPaid(BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        reservation.setOutstandingBalance(totalPrice);
        reservation.setPaymentStatus(PaymentStatus.UNPAID);
        reservation.setInvoiceFinalized(false);
        reservation.setConfirmationNumber(generateUniqueConfirmationNumber());

        Reservation saved = reservationRepository.save(reservation);

        ReservationResponse response = toResponse(saved, financialService.summarize(saved));

        sendReservationConfirmationEmail(saved, response);

        return response;
    }

    // =============================
    // MODIFY RESERVATION
    // =============================

    public ReservationActionPlaceholderResponse modify(Long id, ReservationModifyRequest request) {

        Reservation reservation = findReservationById(id);

        if (reservation.getStatus() == ReservationStatus.CANCELLED
                || reservation.getStatus() == ReservationStatus.CHECKED_IN
                || reservation.getStatus() == ReservationStatus.CHECKED_OUT) {
            throw new ResourceConflictException(
                    "Cannot modify reservation in status: " + reservation.getStatus());
        }

        String oldRoom = reservation.getRoom().getRoomNumber();
        String oldCheckIn = reservation.getCheckInDate().toString();
        String oldCheckOut = reservation.getCheckOutDate().toString();

        Room targetRoom = reservation.getRoom();
        if (request.getRoomId() != null && !request.getRoomId().equals(targetRoom.getId())) {
            targetRoom = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        }

        LocalDate newCheckIn = request.getCheckInDate() != null
                ? request.getCheckInDate()
                : reservation.getCheckInDate();
        LocalDate newCheckOut = request.getCheckOutDate() != null
                ? request.getCheckOutDate()
                : reservation.getCheckOutDate();

        if (!newCheckOut.isAfter(newCheckIn)) {
            throw new ResourceConflictException("Check-out must be after check-in");
        }

        if (!reservationRepository.findOverlappingForUpdate(
                targetRoom.getId(),
                newCheckIn,
                newCheckOut,
                reservation.getId()).isEmpty()) {
            throw new ResourceConflictException("Selected room is not available for the requested dates");
        }

        long nights = ChronoUnit.DAYS.between(newCheckIn, newCheckOut);

        BigDecimal roomRate = targetRoom.getRoomType()
                .getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxRate = hotelSettingsService.getTaxRate();

        BigDecimal subtotal = roomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxes = subtotal.multiply(taxRate)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal totalPrice = subtotal.add(taxes)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        String modificationReason = request.getModificationReason().trim();

        reservation.setRoom(targetRoom);
        reservation.setCheckInDate(newCheckIn);
        reservation.setCheckOutDate(newCheckOut);
        reservation.setTotalPrice(totalPrice);
        reservation.setOutstandingBalance(calculateOutstandingBalance(totalPrice, reservation.getTotalPaid()));
        reservation.setModificationReason(modificationReason);
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

        } catch (RuntimeException ex) {
            log.warn("Failed to send modification email for reservation {}", reservation.getId(), ex);
        }

        auditService.log(
                "RESERVATION_MODIFIED",
                "Reservation#" + saved.getId(),
                "confirmation=" + saved.getConfirmationNumber());

        return toPlaceholderResponse(saved, "modify", "Reservation modified");
    }

    // =============================
    // CANCEL RESERVATION
    // =============================

    public ReservationActionPlaceholderResponse cancel(Long id, ReservationCancelRequest request) {

        Reservation reservation = findReservationById(id);

        if (reservation.getStatus() == ReservationStatus.CHECKED_IN
                || reservation.getStatus() == ReservationStatus.CHECKED_OUT) {
            throw new ResourceConflictException(
                    "Cannot cancel reservation that is already checked in or checked out");
        }

        String cancellationReason = null;
        if (request != null && request.getCancellationReason() != null) {
            String trimmedReason = request.getCancellationReason().trim();
            if (!trimmedReason.isEmpty()) {
                cancellationReason = trimmedReason;
            }
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancellationReason(cancellationReason);
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

        } catch (RuntimeException ex) {
            log.warn("Failed to send cancellation email for reservation {}", reservation.getId(), ex);
        }

        auditService.log(
                "RESERVATION_CANCELLED",
                "Reservation#" + saved.getId(),
                "confirmation=" + saved.getConfirmationNumber());

        return toPlaceholderResponse(saved, "cancel", "Reservation cancelled");
    }

    // =============================
    // CHECK-IN
    // =============================

    public ReservationResponse checkIn(String confirmationNumber) {
        String normalizedConfirmationNumber = normalizeConfirmationNumber(confirmationNumber);

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(normalizedConfirmationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        if (reservation.getStatus() != ReservationStatus.CONFIRMED
                && reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResourceConflictException("Only PENDING or CONFIRMED reservations can be checked in");
        }

        if (LocalDate.now().isBefore(reservation.getCheckInDate())) {
            throw new ResourceConflictException("Cannot check in before scheduled check-in date");
        }

        Room room = reservation.getRoom();

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResourceConflictException("Room not ready");
        }

        room.setStatus(RoomStatus.OCCUPIED);
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setActualCheckInDate(LocalDate.now());
        reservation.setModifiedAt(LocalDateTime.now());

        roomRepository.save(room);
        reservationRepository.save(reservation);

        auditService.log(
                "ROOM_STATUS_CHANGE",
                "Room",
                "Room " + room.getRoomNumber() + " status changed to OCCUPIED during check-in");

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(),
                reservation.getCheckOutDate());

        BigDecimal rate = room.getRoomType()
                .getBasePrice()
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxRate = hotelSettingsService.getTaxRate();

        BigDecimal subtotal = rate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxes = subtotal.multiply(taxRate)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return toResponse(reservation, financialService.summarize(reservation));
    }

    // =============================
    // CHECK-OUT
    // =============================

    public ReservationActionPlaceholderResponse checkOut(String confirmationNumber) {
        String normalizedConfirmationNumber = normalizeConfirmationNumber(confirmationNumber);

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(normalizedConfirmationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        if (reservation.getStatus() == ReservationStatus.CHECKED_OUT) {
            return toPlaceholderResponse(
                    reservation,
                    "check-out",
                    "Checkout already completed");
        }

        if (reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new ResourceConflictException("Only CHECKED_IN reservations can be checked out");
        }

        Room room = reservation.getRoom();
        if (room.getStatus() != RoomStatus.OCCUPIED) {
            throw new ResourceConflictException("Room must be OCCUPIED before checkout");
        }

        if (financialService.syncReservation(reservation)) {
            reservationRepository.save(reservation);
        }

        if (!reservation.isInvoiceFinalized()) {
            throw new PaymentValidationException(
                    "PAYMENT_NOT_FINALIZED",
                    "Payment must be finalized before checkout",
                    resolvePaymentStatusForValidation(reservation),
                    safeMoney(reservation.getOutstandingBalance()),
                    reservation.isInvoiceFinalized());
        }

        BigDecimal outstanding = safeMoney(reservation.getOutstandingBalance());
        if (outstanding.compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP)) > 0) {
            throw new PaymentValidationException(
                    "PAYMENT_BALANCE_DUE",
                    "Outstanding balance must be 0.00 before checkout. Current outstanding: " + outstanding,
                    resolvePaymentStatusForValidation(reservation),
                    outstanding,
                    reservation.isInvoiceFinalized());
        }

        reservation.setStatus(ReservationStatus.CHECKED_OUT);
        reservation.setActualCheckOutAt(LocalDateTime.now());
        reservation.setModifiedAt(LocalDateTime.now());

        room.setStatus(RoomStatus.NEEDS_CLEANING);

        roomRepository.save(room);
        reservationRepository.save(reservation);

        triggerHousekeepingEvent(room);

        auditService.log(
                "CHECKOUT_COMPLETED",
                reservation.getConfirmationNumber(),
                "room=" + room.getRoomNumber() + " roomStatus=NEEDS_CLEANING");

        auditService.log(
                "ROOM_STATUS_CHANGE",
                "Room",
                "Room " + room.getRoomNumber()
                        + " status changed to NEEDS_CLEANING after checkout");

        log.info("Room {} set to NEEDS_CLEANING after checkout", room.getRoomNumber());

        return toPlaceholderResponse(
                reservation,
                "check-out",
                "Checkout completed successfully");
    }

    // =============================
    // GET BY CONFIRMATION NUMBER
    // =============================

    @Transactional(readOnly = true)
    public ReservationResponse getByConfirmationNumber(String confirmationNumber) {
        String normalizedConfirmationNumber = normalizeConfirmationNumber(confirmationNumber);

        Reservation reservation = reservationRepository
                .findByConfirmationNumber(normalizedConfirmationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        return toResponse(reservation, financialService.summarize(reservation));
    }

    // =============================
    // HELPERS
    // =============================

    private void triggerHousekeepingEvent(Room room) {
        housekeepingNotificationService.notifyCheckoutNeedsCleaning(room.getRoomNumber());
        log.info("Housekeeping routing verified for checkout: room {}", room.getRoomNumber());
    }

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
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with id: " + id));
    }

    private void sendReservationConfirmationEmail(
            Reservation reservation,
            ReservationResponse response) {

        try {
            emailService.sendReservationConfirmationEmail(
                    reservation.getGuest().getEmail(),
                    reservation.getGuest().getName(),
                    response);

        } catch (RuntimeException ex) {
            throw new EmailDeliveryException("Failed to send confirmation email", ex);
        }
    }

    private ReservationActionPlaceholderResponse toPlaceholderResponse(
            Reservation reservation,
            String action,
            String message) {
        ReservationFinancialService.ReservationFinancialSummary summary = financialService.summarize(reservation);

        return new ReservationActionPlaceholderResponse(
                reservation.getId(),
                action,
                message,
                true,
                reservation.getStatus(),
                summary.paymentStatus().name(),
                summary.outstandingBalance(),
                summary.invoiceFinalized());
    }

    private BigDecimal calculateOutstandingBalance(BigDecimal total, BigDecimal paid) {
        BigDecimal safeTotal = safeMoney(total);
        BigDecimal safePaid = safeMoney(paid);
        BigDecimal outstanding = safeTotal.subtract(safePaid).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        return outstanding.compareTo(BigDecimal.ZERO) < 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                : outstanding;
    }

    private BigDecimal safeMoney(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private String resolvePaymentStatusForValidation(Reservation reservation) {
        BigDecimal outstanding = safeMoney(reservation.getOutstandingBalance());

        if (reservation.getPaymentStatus() == PaymentStatus.FAILED) {
            return PaymentStatus.FAILED.name();
        }

        if (outstanding.compareTo(BigDecimal.ZERO) > 0) {
            return reservation.getTotalPaid() != null
                    && safeMoney(reservation.getTotalPaid())
                            .compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP)) > 0
                                    ? PaymentStatus.PARTIALLY_PAID.name()
                                    : PaymentStatus.UNPAID.name();
        }

        return PaymentStatus.PAID.name();
    }

    @Transactional(readOnly = true)
    public java.util.List<ReservationResponse> getAllReservations() {
        return getAllReservations(new ReservationFilterRequest());
    }

    @Transactional(readOnly = true)
    public java.util.List<ReservationResponse> getAllReservations(ReservationFilterRequest filters) {

        ReservationFilterRequest effectiveFilters = filters != null ? filters : new ReservationFilterRequest();
        String normalizedConfirmation = effectiveFilters.normalizedConfirmation();
        boolean confirmationScoped = effectiveFilters.hasConfirmationFilter();

        if (!confirmationScoped
                && effectiveFilters.getCheckInDate() != null
                && effectiveFilters.getCheckOutDate() != null
                && effectiveFilters.getCheckOutDate().isBefore(effectiveFilters.getCheckInDate())) {
            throw new IllegalArgumentException("checkOutDate cannot be before checkInDate");
        }

        java.util.List<Reservation> reservations = reservationRepository.findAllByOptionalFilters(
                normalizedConfirmation,
                confirmationScoped ? null : effectiveFilters.normalizedGuestName(),
                confirmationScoped ? null : effectiveFilters.effectiveStatus(),
                confirmationScoped ? null : effectiveFilters.getCheckInDate(),
                confirmationScoped ? null : effectiveFilters.getCheckOutDate());

        return reservations.stream()
                .map(reservation -> toResponse(reservation, financialService.summarize(reservation)))
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.List<ReservationResponse> getAllReservations(
            String confirmation,
            String guestName,
            ReservationStatus status,
            LocalDate checkInDate,
            LocalDate checkOutDate) {
        return getAllReservations(new ReservationFilterRequest(
                confirmation,
                guestName,
                status,
                checkInDate,
                checkOutDate));
    }

    private ReservationResponse toResponse(
            Reservation reservation,
            ReservationFinancialService.ReservationFinancialSummary summary) {
        ReservationResponse response = new ReservationResponse(
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
                summary.nights(),
                summary.roomRate(),
                summary.subtotal(),
                summary.taxes(),
                summary.totalPrice(),
                summary.totalPaid(),
                summary.outstandingBalance(),
                summary.invoiceFinalized(),
                summary.paymentStatus().name());
        response.setActualCheckInDate(reservation.getActualCheckInDate());
        response.setActualCheckOutAt(reservation.getActualCheckOutAt());
        return response;
    }

    private String normalizeConfirmationNumber(String confirmationNumber) {
        if (confirmationNumber == null || confirmationNumber.isBlank()) {
            throw new IllegalArgumentException("Confirmation number is required");
        }
        return confirmationNumber.trim().toUpperCase(Locale.ROOT);
    }
}
