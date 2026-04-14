package com.roomify.backend.service;

import com.roomify.backend.dto.EmailDeliveryStatus;
import com.roomify.backend.dto.ReservationResponse;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import org.thymeleaf.context.Context;
import org.thymeleaf.TemplateEngine;

@Service
@RequiredArgsConstructor
public class EmailService {

        private final JavaMailSender mailSender;
        private final EmailLogService emailLogService;
        private final InvoiceDeliveryLogService invoiceDeliveryLogService;
        private final TemplateEngine templateEngine;

        @Value("${app.email.from:no-reply@roomify.com}")
        private String fromAddress;

        // ===============================
        // CORE EMAIL SENDER
        // ===============================

        private void sendHtmlEmail(
                        String to,
                        String subject,
                        String template,
                        Context context,
                        String confirmationNumber) {

                String htmlBody = templateEngine.process(template, context);

                try {

                        MimeMessage message = mailSender.createMimeMessage();

                        MimeMessageHelper helper = new MimeMessageHelper(message, true);

                        helper.setTo(to);
                        helper.setFrom(fromAddress);
                        helper.setSubject(subject);
                        helper.setText(htmlBody, true);

                        mailSender.send(message);

                        emailLogService.log(
                                        to,
                                        subject,
                                        EmailDeliveryStatus.SENT,
                                        null,
                                        confirmationNumber);

                } catch (MailException | MessagingException ex) {

                        emailLogService.log(
                                        to,
                                        subject,
                                        EmailDeliveryStatus.FAILED,
                                        ex.getMessage(),
                                        confirmationNumber);

                        // Intentionally eating the exception so it doesn't rollback the reservation transaction
                        org.slf4j.LoggerFactory.getLogger(EmailService.class).error("Email sending failed for subject '{}'", subject, ex);
                }
        }

        public void sendInvoiceEmail(
                        String recipient,
                        byte[] pdf,
                        String invoiceNumber) {

                try {

                        MimeMessage message = mailSender.createMimeMessage();

                        MimeMessageHelper helper = new MimeMessageHelper(message, true);

                        helper.setTo(recipient);
                        helper.setFrom(fromAddress);
                        helper.setSubject("Roomify Invoice " + invoiceNumber);

                        helper.setText("""
                                        Dear Guest,

                                        Please find attached your Roomify hotel invoice.

                                        Invoice Number: """ + invoiceNumber + """

                                        Thank you for choosing Roomify Hotel.

                                        Best regards,
                                        Roomify Team
                                        """);

                        helper.addAttachment(
                                        "invoice-" + invoiceNumber + ".pdf",
                                        new ByteArrayResource(pdf));

                        mailSender.send(message);

                } catch (Exception ex) {
                        throw new RuntimeException("Failed to send invoice email", ex);
                }
        }

        // ===============================
        // RECEIPT EMAIL
        // ===============================

        public void sendReceiptEmail(
                        String to,
                        String guestName,
                        String confirmationNumber,
                        String receiptNumber,
                        String invoiceNumber,
                        String paymentMethod,
                        String paymentDate,
                        String amount) {

                Context context = new Context();

                context.setVariable("guest", guestName);
                context.setVariable("confirmationNumber", confirmationNumber);
                context.setVariable("receiptNumber", receiptNumber);
                context.setVariable("invoiceNumber", invoiceNumber);
                context.setVariable("paymentMethod", paymentMethod);
                context.setVariable("paymentDate", paymentDate);
                context.setVariable("amount", amount);

                String subject = "Payment Receipt - " + receiptNumber;

                try {

                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, true);

                        helper.setTo(to);
                        helper.setFrom(fromAddress);
                        helper.setSubject(subject);

                        String htmlBody = templateEngine.process("email/receipt-email", context);
                        helper.setText(htmlBody, true);

                        mailSender.send(message);

                        invoiceDeliveryLogService.logSuccess(
                                        to,
                                        InvoiceDeliveryLogService.RECEIPT_SUBJECT,
                                        confirmationNumber);

                } catch (MailException | MessagingException ex) {

                        invoiceDeliveryLogService.logFailure(
                                        to,
                                        InvoiceDeliveryLogService.RECEIPT_SUBJECT,
                                        confirmationNumber,
                                        ex.getMessage());

                        throw new RuntimeException("Receipt email failed", ex);
                }
        }

        // ===============================
        // STAFF WELCOME EMAIL
        // ===============================

        public void sendStaffWelcomeEmail(
                        String to,
                        String name,
                        String password) {

                Context context = new Context();

                context.setVariable("name", name);
                context.setVariable("email", to);
                context.setVariable("password", password);

                sendHtmlEmail(
                                to,
                                "Welcome to Roomify Staff Portal",
                                "email/staff-welcome-email",
                                context,
                                null);
        }

        // ===============================
        // CONFIRMATION EMAIL
        // ===============================

        public void sendReservationConfirmationEmail(
                        String to,
                        String guestName,
                        ReservationResponse reservation) {

                String subject = "Reservation Confirmation";
                if (emailLogService.isEmailAlreadySent(reservation.getConfirmationNumber(), subject)) {
                    org.slf4j.LoggerFactory.getLogger(EmailService.class).info("Confirmation email already sent for {}, skipping.", reservation.getConfirmationNumber());
                    return;
                }

                Context context = new Context();

                context.setVariable("guest", guestName);
                context.setVariable("room", reservation.getRoomNumber());
                context.setVariable("checkin", reservation.getCheckInDate());
                context.setVariable("checkout", reservation.getCheckOutDate());
                context.setVariable("total", reservation.getTotalPrice());
                context.setVariable("confirmation",
                                reservation.getConfirmationNumber());

                sendHtmlEmail(
                                to,
                                subject,
                                "email/confirmation-email",
                                context,
                                reservation.getConfirmationNumber());
        }

        // ===============================
        // CANCELLATION EMAIL
        // ===============================

        public void sendReservationCancellationEmail(
                        String to,
                        String guest,
                        String room,
                        String checkin,
                        String checkout,
                        String total,
                        String confirmation) {

                Context context = new Context();

                context.setVariable("guest", guest);
                context.setVariable("room", room);
                context.setVariable("checkin", checkin);
                context.setVariable("checkout", checkout);
                context.setVariable("total", total);
                context.setVariable("confirmation", confirmation);

                sendHtmlEmail(
                                to,
                                "Reservation Cancelled",
                                "email/cancellation-email",
                                context,
                                confirmation);
        }

        // ===============================
        // MODIFICATION EMAIL
        // ===============================

        public void sendReservationModificationEmail(
                        String to,
                        String oldRoom,
                        String newRoom,
                        String oldCheckin,
                        String newCheckin,
                        String oldCheckout,
                        String newCheckout,
                        String newTotal,
                        String confirmation) {

                Context context = new Context();

                context.setVariable("oldRoom", oldRoom);
                context.setVariable("newRoom", newRoom);

                context.setVariable("oldCheckin", oldCheckin);
                context.setVariable("newCheckin", newCheckin);

                context.setVariable("oldCheckout", oldCheckout);
                context.setVariable("newCheckout", newCheckout);

                context.setVariable("newTotal", newTotal);
                context.setVariable("confirmation", confirmation);

                sendHtmlEmail(
                                to,
                                "Reservation Modified",
                                "email/modification-email",
                                context,
                                confirmation);
        }
}
