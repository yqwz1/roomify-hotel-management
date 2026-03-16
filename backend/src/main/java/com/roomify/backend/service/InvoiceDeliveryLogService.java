package com.roomify.backend.service;

import org.springframework.stereotype.Service;

import com.roomify.backend.dto.InvoiceDeliveryStatus;
import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.repository.InvoiceDeliveryLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InvoiceDeliveryLogService {

    private final InvoiceDeliveryLogRepository repository;

    /**
     * Log successful email delivery
     */
    public void logSuccess(String email, String confirmationNumber) {

        try {

            String subject = buildSubject(confirmationNumber);

            repository.save(
                    new InvoiceDeliveryLog(
                            email,
                            subject,
                            confirmationNumber,
                            InvoiceDeliveryStatus.SENT,
                            null));

        } catch (Exception ex) {

            // Logging must never break invoice flow
            System.err.println("Delivery log failed: " + ex.getMessage());
        }
    }

    /**
     * Log failed email delivery
     */
    public void logFailure(String email, String confirmationNumber, String error) {

        try {

            String subject = buildSubject(confirmationNumber);

            repository.save(
                    new InvoiceDeliveryLog(
                            email,
                            subject,
                            confirmationNumber,
                            InvoiceDeliveryStatus.FAILED,
                            sanitizeError(error)));

        } catch (Exception ex) {

            System.err.println("Delivery log failed: " + ex.getMessage());
        }
    }

    /**
     * Optional: log email attempt before sending
     */
    public void logAttempt(String email, String confirmationNumber) {

        try {

            String subject = buildSubject(confirmationNumber);

            repository.save(
                    new InvoiceDeliveryLog(
                            email,
                            subject,
                            confirmationNumber,
                            InvoiceDeliveryStatus.ATTEMPT,
                            null));

        } catch (Exception ex) {

            System.err.println("Delivery log failed: " + ex.getMessage());
        }
    }

    /**
     * Builds standard invoice email subject
     */
    private String buildSubject(String confirmationNumber) {
        return "Roomify Invoice - " + confirmationNumber;
    }

    /**
     * Prevents database overflow for long errors
     */
    private String sanitizeError(String error) {

        if (error == null) {
            return null;
        }

        int maxLength = 900;

        if (error.length() > maxLength) {
            return error.substring(0, maxLength);
        }

        return error;
    }
}