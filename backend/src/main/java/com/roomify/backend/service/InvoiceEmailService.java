package com.roomify.backend.service;

import com.roomify.backend.dto.InvoiceDeliveryStatus;
import com.roomify.backend.entity.Reservation;

import jakarta.mail.internet.MimeMessage;

import lombok.RequiredArgsConstructor;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InvoiceEmailService {

    private final JavaMailSender mailSender;
    private final InvoicePdfService pdfService;
    private final InvoiceLogService logService;

    public void sendInvoiceEmail(Reservation reservation) {

        String to = reservation.getGuest().getEmail();
        String subject = "Roomify Invoice";

        try {

            byte[] pdf = pdfService.generateInvoice(reservation);

            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText("Your reservation invoice is attached.");

            helper.addAttachment(
                    "invoice-" +
                            reservation.getConfirmationNumber()
                            + ".pdf",
                    new ByteArrayResource(pdf));

            mailSender.send(message);

            logService.log(
                    to,
                    subject,
                    reservation.getConfirmationNumber(),
                    InvoiceDeliveryStatus.SENT,
                    null);

        } catch (Exception ex) {

            logService.log(
                    to,
                    subject,
                    reservation.getConfirmationNumber(),
                    InvoiceDeliveryStatus.FAILED,
                    ex.getMessage());

            throw new RuntimeException("Invoice email failed", ex);
        }
    }
}