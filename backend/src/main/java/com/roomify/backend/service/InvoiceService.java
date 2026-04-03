package com.roomify.backend.service;

import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.entity.Reservation;
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

    @Transactional
    public void generateInvoice(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.isInvoiceFinalized()) {
            throw new RuntimeException("Invoice already finalized for this reservation");
        }

        String invoiceNumber = getOrCreateInvoiceNumber(reservation);

        byte[] pdf = invoicePdfService.generateInvoice(reservation, invoiceNumber);

        sendInvoiceEmail(reservation, pdf, invoiceNumber);

        reservation.setInvoiceFinalized(true);
        reservationRepository.save(reservation);
    }

    public byte[] getInvoicePdf(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (!reservation.isInvoiceFinalized()) {
            throw new RuntimeException("Invoice not generated yet");
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

        try {

            emailService.sendInvoiceEmail(
                    email,
                    pdf,
                    invoiceNumber);

            deliveryLogService.logSuccess(
                    email,
                    "Invoice",
                    confirmationNumber);

        } catch (Exception ex) {

            deliveryLogService.logFailure(
                    email,
                    "Invoice",
                    confirmationNumber,
                    ex.getMessage());
        }
    }

    /**
     * Get latest invoice delivery status for a reservation.
     */
    public Optional<InvoiceDeliveryLog> getLatestDeliveryStatus(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        String confirmationNumber = reservation.getConfirmationNumber();

        return deliveryLogService.getLatestByConfirmationNumber(confirmationNumber);
    }
}