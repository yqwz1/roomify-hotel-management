package com.roomify.backend.service;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.repository.ReservationRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final ReservationRepository reservationRepository;
    private final InvoicePdfService invoicePdfService;
    private final EmailService emailService;
    private final InvoiceDeliveryLogService deliveryLogService;

    /**
     * Generate invoice for a reservation
     */
    public void generateInvoice(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        String invoiceNumber = generateInvoiceNumber();

        byte[] pdf = invoicePdfService.generateInvoice(reservation, invoiceNumber);

        sendInvoiceEmail(reservation, pdf, invoiceNumber);
    }

    /**
     * Download invoice PDF
     */
    public byte[] getInvoicePdf(Long reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        String invoiceNumber = generateInvoiceNumber();

        return invoicePdfService.generateInvoice(reservation, invoiceNumber);
    }

    /**
     * Send invoice email
     */
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

            deliveryLogService.logSuccess(email, confirmationNumber);

        } catch (Exception ex) {

            deliveryLogService.logFailure(
                    email,
                    confirmationNumber,
                    ex.getMessage());
        }
    }

    /**
     * Generate unique invoice number
     */
    private String generateInvoiceNumber() {

        return "INV-" + UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();
    }
}