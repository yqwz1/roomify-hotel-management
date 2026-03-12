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

    public void logSuccess(String email, String confirmationNumber) {

        String subject = "Roomify Invoice - " + confirmationNumber;

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        subject,
                        confirmationNumber,
                        InvoiceDeliveryStatus.SENT,
                        null
                ));
    }

    public void logFailure(String email, String confirmationNumber, String error) {

        String subject = "Roomify Invoice - " + confirmationNumber;

        repository.save(
                new InvoiceDeliveryLog(
                        email,
                        subject,
                        confirmationNumber,
                        InvoiceDeliveryStatus.FAILED,
                        error
                ));
    }
}