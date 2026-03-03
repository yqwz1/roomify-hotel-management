package com.roomify.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailLogService emailLogService;

    @Value("${app.email.from:no-reply@roomify.com}")
    private String fromAddress;

    public void sendStaffWelcomeEmail(String to, String name, String temporaryPassword) {

        String subject = "Your Roomify staff account";
        String htmlBody = buildHtmlBody(name, temporaryPassword);

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

    private String buildHtmlBody(String name, String temporaryPassword) {

        String greeting = (name == null || name.isBlank())
                ? "Hello"
                : "Hello " + name;

        return """
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Welcome to Roomify</h2>
                    <p>%s,</p>
                    <p>Your staff account has been created.</p>
                    <p><strong>Temporary password:</strong> %s</p>
                    <p>Please log in and change your password immediately.</p>
                    <br>
                    <p>Roomify Team</p>
                </body>
                </html>
                """.formatted(greeting, temporaryPassword);
    }
}