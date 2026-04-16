package com.roomify.backend.service;

import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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

        String invoiceNumber = "INV-" + UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();

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
}
