package com.roomify.backend.service;

import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.dto.InvoiceDetailsDto;
import com.roomify.backend.dto.InvoiceListItemDto;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final ReservationRepository reservationRepository;
    private final InvoicePdfService invoicePdfService;
    private final EmailService emailService;
    private final InvoiceDeliveryLogService deliveryLogService;
    private final AuditService auditService;
    private final ReservationFinancialService financialService;
    private final InvoiceNumberService invoiceNumberService;
    private final BillingService billingService;
    private final GuestRepository guestRepository;

    @Transactional
    public void generateInvoice(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (reservation.isInvoiceFinalized()) {
            throw new ResourceConflictException("Invoice already finalized for this reservation");
        }

        financialService.syncReservation(reservation);

        String invoiceNumber = getOrCreateInvoiceNumber(reservation);

        byte[] pdf = invoicePdfService.generateInvoice(reservation, invoiceNumber);

        sendInvoiceEmail(reservation, pdf, invoiceNumber);

        reservation.setInvoiceFinalized(true);
        reservationRepository.save(reservation);
        auditService.log("INVOICE_GENERATED", reservation.getConfirmationNumber(), "invoiceNumber=" + invoiceNumber);
    }

    @Transactional(readOnly = true)
    public List<InvoiceListItemDto> getInvoiceHistory() {
        return reservationRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(Reservation::getCheckInDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Reservation::getConfirmationNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toInvoiceListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceDetailsDto getInvoiceDetails(Long reservationId) {
        Reservation reservation = findReservationById(reservationId);
        return buildInvoiceDetails(reservation);
    }

    @Transactional(readOnly = true)
    public List<InvoiceListItemDto> getGuestInvoiceHistory() {
        Set<Long> seenReservationIds = new HashSet<>();

        return getAuthenticatedGuests().stream()
                .map(Guest::getId)
                .flatMap(guestId -> reservationRepository.findByGuest_Id(guestId).stream())
                .filter(reservation -> reservation.getId() == null || seenReservationIds.add(reservation.getId()))
                .sorted(Comparator
                        .comparing(Reservation::getCheckInDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Reservation::getConfirmationNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toInvoiceListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceDetailsDto getGuestInvoiceDetails(String confirmationNumber) {
        Reservation reservation = findOwnedReservation(confirmationNumber);
        return buildInvoiceDetails(reservation);
    }

    @Transactional(readOnly = true)
    public byte[] getGuestInvoicePdf(String confirmationNumber) {
        Reservation reservation = findOwnedReservation(confirmationNumber);
        return getInvoicePdf(reservation.getId());
    }

    public byte[] getInvoicePdf(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        financialService.syncReservation(reservation);

        if (!reservation.isInvoiceFinalized()) {
            throw new ResourceConflictException("Invoice not generated yet");
        }

        String invoiceNumber = getOrCreateInvoiceNumber(reservation);

        return invoicePdfService.generateInvoice(reservation, invoiceNumber);
    }

    private String getOrCreateInvoiceNumber(Reservation reservation) {

        if (reservation.getInvoiceNumber() != null && !reservation.getInvoiceNumber().isBlank()) {
            return reservation.getInvoiceNumber();
        }

        String invoiceNumber = invoiceNumberService.generate();

        reservation.setInvoiceNumber(invoiceNumber);
        reservationRepository.save(reservation);

        return invoiceNumber;
    }

    private void sendInvoiceEmail(
            Reservation reservation,
            byte[] pdf,
            String invoiceNumber) {

        String email = reservation.getGuest().getEmail();
        String confirmationNumber = reservation.getConfirmationNumber();
        auditService.log(
                "INVOICE_EMAIL_ATTEMPT",
                confirmationNumber,
                "invoiceNumber=" + invoiceNumber + " recipient=" + email);

        try {

            emailService.sendInvoiceEmail(
                    email,
                    pdf,
                    invoiceNumber);

            deliveryLogService.logSuccess(
                    email,
                    InvoiceDeliveryLogService.INVOICE_SUBJECT,
                    confirmationNumber);
            auditService.log(
                    "INVOICE_EMAIL_SENT",
                    confirmationNumber,
                    "invoiceNumber=" + invoiceNumber + " recipient=" + email);

        } catch (Exception ex) {

            deliveryLogService.logFailure(
                    email,
                    InvoiceDeliveryLogService.INVOICE_SUBJECT,
                    confirmationNumber,
                    ex.getMessage());
            auditService.log(
                    "INVOICE_EMAIL_FAILED",
                    confirmationNumber,
                    "invoiceNumber=" + invoiceNumber + " recipient=" + email + " reason=" + ex.getMessage());
        }
    }

    @Transactional
    public Optional<InvoiceDeliveryLog> sendInvoiceEmailForReservation(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (financialService.syncReservation(reservation)) {
            reservationRepository.save(reservation);
        }

        if (!reservation.isInvoiceFinalized()) {
            throw new ResourceConflictException("Invoice email is only available after the bill is finalized");
        }

        String invoiceNumber = getOrCreateInvoiceNumber(reservation);
        byte[] pdf = invoicePdfService.generateInvoice(reservation, invoiceNumber);
        sendInvoiceEmail(reservation, pdf, invoiceNumber);

        return deliveryLogService.getLatestInvoiceByConfirmationNumber(reservation.getConfirmationNumber());
    }

    /**
     * Get latest invoice delivery status for a reservation.
     */
    public Optional<InvoiceDeliveryLog> getLatestDeliveryStatus(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        String confirmationNumber = reservation.getConfirmationNumber();

        return deliveryLogService.getLatestInvoiceByConfirmationNumber(confirmationNumber);
    }

    private InvoiceDetailsDto buildInvoiceDetails(Reservation reservation) {
        InvoiceListItemDto item = toInvoiceListItem(reservation);
        BillResponse bill = billingService.calculateBill(reservation.getConfirmationNumber(), BigDecimal.ZERO, BigDecimal.ZERO);
        Optional<InvoiceDeliveryLog> deliveryLog = deliveryLogService
                .getLatestInvoiceByConfirmationNumber(reservation.getConfirmationNumber());

        return new InvoiceDetailsDto(
                item,
                bill,
                deliveryLog.map(log -> log.getStatus().name()).orElse(item.isInvoiceFinalized() ? "UNKNOWN" : "IDLE"),
                deliveryLog.map(InvoiceDeliveryLog::getErrorMessage).orElse(null),
                deliveryLog.map(InvoiceDeliveryLog::getCreatedAt).orElse(null),
                item.isInvoiceFinalized());
    }

    private InvoiceListItemDto toInvoiceListItem(Reservation reservation) {
        ReservationFinancialService.ReservationFinancialSummary summary = financialService.summarize(reservation);
        Optional<InvoiceDeliveryLog> deliveryLog = deliveryLogService
                .getLatestInvoiceByConfirmationNumber(reservation.getConfirmationNumber());

        return new InvoiceListItemDto(
                reservation.getId(),
                reservation.getConfirmationNumber(),
                reservation.getInvoiceNumber(),
                reservation.getGuest() != null ? reservation.getGuest().getName() : null,
                reservation.getGuest() != null ? reservation.getGuest().getEmail() : null,
                reservation.getRoom() != null ? reservation.getRoom().getRoomNumber() : null,
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                summary.totalPrice(),
                summary.totalPaid(),
                summary.outstandingBalance(),
                summary.invoiceFinalized(),
                summary.paymentStatus().name(),
                deliveryLog.map(log -> log.getStatus().name()).orElse(summary.invoiceFinalized() ? "UNKNOWN" : "IDLE"),
                deliveryLog.map(InvoiceDeliveryLog::getCreatedAt).orElse(null));
    }

    private Reservation findReservationById(Long reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
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
            throw new AccessDeniedException("You do not have access to this invoice");
        }

        return reservation;
    }

    private List<Guest> getAuthenticatedGuests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Guest authentication required");
        }

        String email = normalizeEmail(authentication.getName());
        if (email == null || email.isBlank()) {
            throw new AccessDeniedException("Authenticated guest email is missing");
        }

        List<Guest> guests = guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc(email);
        if (guests.isEmpty()) {
            throw new ResourceNotFoundException("Guest profile not found for authenticated user: " + email);
        }

        return guests;
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
}
