package com.roomify.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.roomify.backend.dto.ReservationResponse;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailLogService emailLogService;

    @Value("${app.email.from:no-reply@roomify.com}")
    private String fromAddress;

    public void sendStaffWelcomeEmail(String to, String name, String temporaryPassword) {

        String subject = "Your Roomify staff account";
        String htmlBody = buildBody(name, temporaryPassword);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setFrom(fromAddress);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            mailSender.send(message);

            // Log success
            emailLogService.log(to, subject, "SENT", null);

        } catch (Exception ex) {

            // Log failure
            emailLogService.log(to, subject, "FAILED", ex.getMessage());

            throw new RuntimeException("Failed to send email", ex);
        }
    }

    public void sendReservationConfirmationEmail(String to, String guestName, ReservationResponse reservation) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(fromAddress);
        message.setSubject("Your Roomify reservation confirmation");
        message.setText(buildReservationConfirmationBody(guestName, reservation));
        mailSender.send(message);
    }

    private String buildBody(String name, String temporaryPassword) {
        String greeting = (name == null || name.isBlank()) ? "Hello" : "Hello " + name;
        return greeting + ",\n\n"
                + "Your staff account has been created in Roomify.\n"
                + "Temporary password: " + temporaryPassword + "\n\n"
                + "Please log in and change your password right away.\n\n"
                + "Thanks,\n"
                + "Roomify Team";
    }

    private String buildReservationConfirmationBody(String guestName, ReservationResponse reservation) {
        String greeting = (guestName == null || guestName.isBlank()) ? "Hello" : "Hello " + guestName;
        return greeting + ",\n\n"
                + "Your reservation is confirmed.\n"
                + "Confirmation number: " + reservation.getConfirmationNumber() + "\n"
                + "Room: " + reservation.getRoomNumber() + "\n"
                + "Check-in: " + reservation.getCheckInDate() + "\n"
                + "Check-out: " + reservation.getCheckOutDate() + "\n"
                + "Total: " + reservation.getTotalPrice() + "\n\n"
                + "Thanks,\n"
                + "Roomify Team";
    }
}
