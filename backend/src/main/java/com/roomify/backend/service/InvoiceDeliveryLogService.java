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

    public static final String INVOICE_SUBJECT = "Invoice";
    public static final String RECEIPT_SUBJECT = "Receipt";

    private final InvoiceDeliveryLogRepository repository;

    /**
     * Log successful delivery
     */
    public void logSuccess(
            String email,
            String subject,
            String confirmationNumber) {

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        subject,
                        confirmationNumber,
                        InvoiceDeliveryStatus.SENT,
                        null));
    }

    /**
     * Log failed delivery
     */
    public void logFailure(
            String email,
            String subject,
            String confirmationNumber,
            String error) {

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

    public Optional<InvoiceDeliveryLog> getLatestInvoiceByConfirmationNumber(String confirmationNumber) {
        return repository.findFirstByConfirmationNumberAndSubjectOrderByCreatedAtDesc(
                confirmationNumber,
                INVOICE_SUBJECT);
    }
}
