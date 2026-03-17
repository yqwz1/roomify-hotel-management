package com.roomify.backend.service;

import com.roomify.backend.dto.InvoiceDeliveryStatus;
import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.repository.InvoiceDeliveryLogRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InvoiceDeliveryLogService {

    private final InvoiceDeliveryLogRepository repository;

    public void logSuccess(String email, String confirmationNumber) {

        String subject = "Roomify Invoice - " + confirmationNumber;

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        subject,
                        confirmationNumber,
                        InvoiceDeliveryStatus.SENT,
                        null));
    }

    public void logFailure(String email, String confirmationNumber, String error) {

        String subject = "Roomify Invoice - " + confirmationNumber;

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

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        subject,
                        confirmationNumber,
                        InvoiceDeliveryStatus.FAILED,
                        error));
    }

    public Optional<InvoiceDeliveryLog> getLatestByConfirmationNumber(String confirmationNumber) {
        return repository.findFirstByConfirmationNumberOrderByCreatedAtDesc(confirmationNumber);
    }
}