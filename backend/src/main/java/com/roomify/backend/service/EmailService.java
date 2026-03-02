package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.email.from:no-reply@roomify.com}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendStaffWelcomeEmail(String to, String name, String temporaryPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(fromAddress);
        message.setSubject("Your Roomify staff account");
        message.setText(buildBody(name, temporaryPassword));
        mailSender.send(message);
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
