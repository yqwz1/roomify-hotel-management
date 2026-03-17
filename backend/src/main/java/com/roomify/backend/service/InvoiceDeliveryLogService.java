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

    /**
     * Log successful email delivery
     */
    public void logSuccess(String email, String confirmationNumber) {

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        "Invoice",
                        confirmationNumber,
                        InvoiceDeliveryStatus.SENT,
                        null));
    }

    /**
     * Log failed email delivery
     */
    public void logFailure(String email, String confirmationNumber, String error) {

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        "Invoice",
                        confirmationNumber,
                        InvoiceDeliveryStatus.FAILED,
                        error));
    }

    public Optional<InvoiceDeliveryLog> getLatestByConfirmationNumber(String confirmationNumber) {
        return repository.findFirstByConfirmationNumberOrderByCreatedAtDesc(confirmationNumber);
    }
}