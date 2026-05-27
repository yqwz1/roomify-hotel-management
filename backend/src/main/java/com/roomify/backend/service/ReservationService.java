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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationFilterRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationHistoryResponse;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationNoteRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.dto.ReservationStatusUpdateRequest;
import com.roomify.backend.dto.RoomGridReservationDto;
import com.roomify.backend.dto.RoomGridResponse;
import com.roomify.backend.dto.RoomGridRowDto;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.exception.DuplicateResourceException;
import com.roomify.backend.exception.PaymentValidationException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationHistoryRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
    private final NotificationService notificationService;
    private final HousekeepingNotificationService housekeepingNotificationService;
    private final ReservationFinancialService financialService;
    private final ReservationStatusTransitionService reservationStatusTransitionService;
    private final ReservationHistoryRepository reservationHistoryRepository;
    private final BigDecimal taxRate;
    private final InvoiceEmailService invoiceEmailService;
    private final InvoiceDeliveryLogService invoiceDeliveryLogService;

    public ReservationService(
            ReservationRepository reservationRepository,
            GuestRepository guestRepository,
            RoomRepository roomRepository,
            EmailService emailService,
            InvoiceEmailService invoiceEmailService,
            InvoiceDeliveryLogService invoiceDeliveryLogService,
            AuditService auditService,
            NotificationService notificationService,
            HousekeepingNotificationService housekeepingNotificationService,
            ReservationFinancialService financialService,
            ReservationStatusTransitionService reservationStatusTransitionService,
            ReservationHistoryRepository reservationHistoryRepository,
            @Value("${roomify.billing.vat-rate:0.15}") BigDecimal taxRate) {

        this.reservationRepository = reservationRepository;
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
        this.emailService = emailService;
        this.invoiceEmailService = invoiceEmailService;
        this.invoiceDeliveryLogService = invoiceDeliveryLogService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.housekeepingNotificationService = housekeepingNotificationService;
        this.financialService = financialService;
        this.reservationStatusTransitionService = reservationStatusTransitionService;
        this.reservationHistoryRepository = reservationHistoryRepository;
        this.taxRate = taxRate;
    }

    // =============================
    // CREATE RESERVATION
    // =============================

    public ReservationResponse create(ReservationCreateRequest request) {
        return createInternal(
                request,
                null,
                ReservationStatus.PENDING,
                resolveCurrentActor("ROLE_STAFF"));
    }

    public ReservationResponse createForAuthenticatedGuest(ReservationCreateRequest request, String authenticatedEmail) {
        return createInternal(
                request,
                authenticatedEmail,
                reservationStatusTransitionService.resolveInitialGuestStatus(),
                new ReservationStatusTransitionService.ReservationActor(authenticatedEmail, "ROLE_GUEST"));
    }

    private ReservationResponse createInternal(
            ReservationCreateRequest request,
            String authenticatedEmail,
            ReservationStatus initialStatus,
            ReservationStatusTransitionService.ReservationActor actor) {

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResourceConflictException("Room is not available for booking");
        }

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

        Guest guest = resolveOrCreateGuest(request.getGuest(), authenticatedEmail);
        var quote = financialService.quote(
                room.getRoomType().getBasePrice(),
                request.getCheckInDate(),
                request.getCheckOutDate());

        Reservation reservation = new Reservation();
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setCheckInDate(request.getCheckInDate());
        reservation.setCheckOutDate(request.getCheckOutDate());
        reservation.setTotalPrice(quote.getTotal());
        reservation.setTotalPaid(BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        reservation.setOutstandingBalance(quote.getTotal());
        reservation.setPaymentStatus(PaymentStatus.UNPAID);
        reservation.setInvoiceFinalized(false);
        reservation.setInvoiceStatus("PENDING");
        reservation.setConfirmationNumber(generateUniqueConfirmationNumber());
        reservation.setStatusUpdatedAt(LocalDateTime.now());

        Reservation saved = reservationRepository.save(reservation);
        reservationStatusTransitionService.initialize(saved, initialStatus, actor, "Reservation created");

        ReservationResponse response = toResponse(saved, financialService.summarize(saved));

        sendReservationConfirmationEmail(saved, response);
        notificationService.notifyReservationCreated(saved);

        return response;
    }

    // =============================
    // MODIFY RESERVATION
    // =============================

    public ReservationActionPlaceholderResponse modify(Long id, ReservationModifyRequest request) {

        Reservation reservation = findReservationById(id);

        ReservationStatus currentStatus = reservation.getStatus();
        if (currentStatus == ReservationStatus.CANCELLED
                || currentStatus == ReservationStatus.CHECKED_OUT) {
            throw new ResourceConflictException(
                    "Cannot modify reservation in status: " + currentStatus);
        }

        if (currentStatus == ReservationStatus.CHECKED_IN) {
            boolean roomChangeRequested = request.getRoomId() != null
                    && !request.getRoomId().equals(reservation.getRoom().getId());
            boolean checkInChangeRequested = request.getCheckInDate() != null
                    && !request.getCheckInDate().equals(reservation.getCheckInDate());

            if (roomChangeRequested || checkInChangeRequested) {
                throw new ResourceConflictException(
                        "Checked-in reservations can only have their checkout date changed."
                                + " Room and check-in date are locked once the guest has arrived.");
            }
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

        var quote = financialService.quote(
                targetRoom.getRoomType().getBasePrice(),
                newCheckIn,
                newCheckOut);

        String modificationReason = request.getModificationReason().trim();

        reservation.setRoom(targetRoom);
        reservation.setCheckInDate(newCheckIn);
        reservation.setCheckOutDate(newCheckOut);
        reservation.setTotalPrice(quote.getTotal());
        reservation.setOutstandingBalance(calculateOutstandingBalance(quote.getTotal(), reservation.getTotalPaid()));
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
        return cancelReservation(reservation, request);
    }

    public ReservationActionPlaceholderResponse cancelByConfirmationNumber(
            String confirmationNumber,
            ReservationCancelRequest request) {
        Reservation reservation = reservationRepository
                .findByConfirmationNumber(normalizeConfirmationNumber(confirmationNumber))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));
        return cancelReservation(reservation, request);
    }

    private ReservationActionPlaceholderResponse cancelReservation(
            Reservation reservation,
            ReservationCancelRequest request) {

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

        reservationStatusTransitionService.transition(
                reservation,
                ReservationStatus.CANCELLED,
                resolveCurrentActor("ROLE_STAFF"),
                cancellationReason,
                hasManagerOverride());
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
        notificationService.notifyReservationCancelled(saved);

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
                && reservation.getStatus() != ReservationStatus.PENDING
                && reservation.getStatus() != ReservationStatus.PAYMENT_PENDING) {
            throw new ResourceConflictException("Only PENDING, PAYMENT_PENDING, or CONFIRMED reservations can be checked in");
        }

        if (LocalDate.now().isBefore(reservation.getCheckInDate())) {
            throw new ResourceConflictException("Cannot check in before scheduled check-in date");
        }

        Room room = reservation.getRoom();

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResourceConflictException("Room not ready");
        }

        room.setStatus(RoomStatus.OCCUPIED);
        reservationStatusTransitionService.transition(
                reservation,
                ReservationStatus.CHECKED_IN,
                resolveCurrentActor("ROLE_STAFF"),
                "Checked in at front desk",
                true);
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

        reservationStatusTransitionService.transition(
                reservation,
                ReservationStatus.CHECKED_OUT,
                resolveCurrentActor("ROLE_STAFF"),
                "Checked out",
                true);
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

    public ReservationResponse updateStatus(String confirmationNumber, ReservationStatusUpdateRequest request) {
        String normalizedConfirmationNumber = normalizeConfirmationNumber(confirmationNumber);
        Reservation reservation = reservationRepository
                .findByConfirmationNumber(normalizedConfirmationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        reservationStatusTransitionService.transition(
                reservation,
                request.getStatus(),
                resolveCurrentActor("ROLE_STAFF"),
                request.getNote(),
                hasManagerOverride());

        if (request.getStatus() == ReservationStatus.COMPLETED && reservation.getActualCheckOutAt() == null) {
            reservation.setActualCheckOutAt(LocalDateTime.now());
        }

        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved, financialService.summarize(saved));
    }

    public ReservationResponse updateStaffNotes(Long id, ReservationNoteRequest request) {
        Reservation reservation = findReservationById(id);
        reservation.setStaffNotes(request.getNote().trim());
        reservation.setModifiedAt(LocalDateTime.now());
        Reservation saved = reservationRepository.save(reservation);
        auditService.log("RESERVATION_NOTES_UPDATED", saved.getConfirmationNumber(), "notes=true");
        return toResponse(saved, financialService.summarize(saved));
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
        housekeepingNotificationService.notifyCheckoutNeedsCleaning(room);
        log.info("Housekeeping routing verified for checkout: room {}", room.getRoomNumber());
    }

    private Guest resolveOrCreateGuest(ReservationGuestRequest request, String authenticatedEmail) {
        String normalizedAuthenticatedEmail = normalizeEmail(authenticatedEmail);
        String effectiveEmail = normalizedAuthenticatedEmail != null
                ? normalizedAuthenticatedEmail
                : normalizeRequiredValue(request.getEmail(), "Guest email is required");
        String normalizedIdNumber = normalizeRequiredValue(request.getIdNumber(), "Guest ID number is required");

        Guest guestByEmail = guestRepository.findByEmailIgnoreCase(effectiveEmail).orElse(null);
        if (guestByEmail == null) {
            Guest newGuest = new Guest();
            applyGuestProfile(newGuest, request, effectiveEmail, normalizedIdNumber);
            return persistGuest(newGuest);
        }

        applyGuestProfile(guestByEmail, request, effectiveEmail, normalizedIdNumber);
        return persistGuest(guestByEmail);
    }

    private void applyGuestProfile(
            Guest guest,
            ReservationGuestRequest request,
            String effectiveEmail,
            String normalizedIdNumber) {
        guest.setName(normalizeRequiredValue(request.getName(), "Guest name is required"));
        guest.setEmail(effectiveEmail);
        guest.setPhone(normalizeRequiredValue(request.getPhone(), "Guest phone is required"));
        guest.setIdNumber(normalizedIdNumber);
        guest.setNationality(normalizeRequiredValue(request.getNationality(), "Guest nationality is required"));
    }

    private Guest persistGuest(Guest guest) {
        try {
            return guestRepository.save(guest);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException(resolveGuestConstraintMessage(ex));
        }
    }

    private String resolveGuestConstraintMessage(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        String normalizedMessage = message != null ? message.toLowerCase(Locale.ROOT) : "";

        if (normalizedMessage.contains("uk_guest_email") || normalizedMessage.contains("email")) {
            return "A guest with this email already exists. Reuse the existing guest profile or verify the email address.";
        }
        return "Guest profile conflicts with existing records. Refresh the booking form and try again.";
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequiredValue(String value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return trimmed;
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
            log.warn("Failed to queue confirmation email for reservation {}", reservation.getId(), ex);
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

    // =============================
    // ROOM GRID (tape chart)
    // =============================

    private static final int GRID_MAX_WINDOW_DAYS = 60;

    @Transactional(readOnly = true)
    public RoomGridResponse getGrid(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("startDate and endDate are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate must be on or after startDate");
        }
        long windowDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (windowDays > GRID_MAX_WINDOW_DAYS) {
            throw new IllegalArgumentException(
                    "Date range too wide. Maximum window is " + GRID_MAX_WINDOW_DAYS + " days.");
        }

        // Exclusive end for overlap math: a reservation overlaps the window when
        // checkInDate < windowEndExclusive AND checkOutDate > startDate.
        LocalDate windowEndExclusive = endDate.plusDays(1);

        java.util.List<Room> rooms = roomRepository.findAllWithRoomTypeOrderByRoomNumber();
        java.util.List<Reservation> overlapping = reservationRepository
                .findActiveOverlappingForGrid(startDate, windowEndExclusive);

        java.util.Map<Long, java.util.List<RoomGridReservationDto>> byRoomId = new java.util.HashMap<>();
        for (Reservation reservation : overlapping) {
            Long roomId = reservation.getRoom() != null ? reservation.getRoom().getId() : null;
            if (roomId == null) {
                continue;
            }
            byRoomId.computeIfAbsent(roomId, key -> new java.util.ArrayList<>())
                    .add(new RoomGridReservationDto(
                            reservation.getId(),
                            reservation.getConfirmationNumber(),
                            reservation.getGuest() != null ? reservation.getGuest().getName() : null,
                            reservation.getCheckInDate(),
                            reservation.getCheckOutDate(),
                            reservation.getStatus(),
                            null));
        }

        java.util.List<RoomGridRowDto> rows = new java.util.ArrayList<>(rooms.size());
        for (Room room : rooms) {
            String typeName = room.getRoomType() != null ? room.getRoomType().getName() : null;
            rows.add(new RoomGridRowDto(
                    room.getId(),
                    room.getRoomNumber(),
                    deriveRoomTypeCode(typeName),
                    typeName,
                    byRoomId.getOrDefault(room.getId(), new java.util.ArrayList<>())));
        }

        return new RoomGridResponse(startDate, endDate, rows);
    }

    private String deriveRoomTypeCode(String typeName) {
        if (typeName == null || typeName.isBlank()) {
            return null;
        }
        String trimmed = typeName.trim();
        String[] words = trimmed.split("\\s+");
        if (words.length >= 2) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < words.length && code.length() < 3; i++) {
                if (!words[i].isEmpty()) {
                    code.append(words[i].charAt(0));
                }
            }
            return code.toString().toUpperCase(Locale.ROOT);
        }
        return trimmed.substring(0, Math.min(3, trimmed.length())).toUpperCase(Locale.ROOT);
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
        response.setPaymentMethod(reservation.getPaymentMethod() != null ? reservation.getPaymentMethod().name() : null);
        response.setTransactionId(reservation.getTransactionId());
        response.setInvoiceStatus(reservation.getInvoiceStatus());
        response.setPaymentTimestamp(reservation.getPaymentTimestamp());
        response.setActualCheckInDate(reservation.getActualCheckInDate());
        response.setActualCheckOutAt(reservation.getActualCheckOutAt());
        response.setStaffNotes(reservation.getStaffNotes());
        response.setStatusUpdatedAt(reservation.getStatusUpdatedAt());
        response.setVersion(reservation.getVersion());
        response.setPricing(financialService.quote(
                reservation.getRoom().getRoomType().getBasePrice(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate()));
        response.setStatusHistory(reservationHistoryRepository.findByReservation_IdOrderByChangedAtAsc(reservation.getId())
                .stream()
                .map(entry -> new ReservationHistoryResponse(
                        entry.getFromStatus(),
                        entry.getToStatus(),
                        entry.getActorEmail(),
                        entry.getActorRole(),
                        entry.getNote(),
                        entry.getChangedAt()))
                .toList());
        return response;
    }

    private ReservationStatusTransitionService.ReservationActor resolveCurrentActor(String fallbackRole) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication != null ? authentication.getName() : "system@roomify.local";
        String roleCode = fallbackRole;
        if (authentication != null && authentication.getAuthorities() != null) {
            roleCode = authentication.getAuthorities().stream()
                    .map(grantedAuthority -> grantedAuthority.getAuthority())
                    .findFirst()
                    .orElse(fallbackRole);
        }
        return new ReservationStatusTransitionService.ReservationActor(email, roleCode);
    }

    private boolean hasManagerOverride() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_MANAGER".equals(authority.getAuthority()));
    }

    private String normalizeConfirmationNumber(String confirmationNumber) {
        if (confirmationNumber == null || confirmationNumber.isBlank()) {
            throw new IllegalArgumentException("Confirmation number is required");
        }
        return confirmationNumber.trim().toUpperCase(Locale.ROOT);
    }
}
