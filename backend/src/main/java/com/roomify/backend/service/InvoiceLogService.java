package com.roomify.backend.service;

import com.roomify.backend.dto.InvoiceDeliveryStatus;
import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.repository.InvoiceDeliveryLogRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InvoiceLogService {

    private final InvoiceDeliveryLogRepository repository;

    public void log(
            String to,
            String subject,
            String confirmationNumber,
            InvoiceDeliveryStatus status,
            String error) {

        InvoiceDeliveryLog log = new InvoiceDeliveryLog(
                to,
                subject,
                confirmationNumber,
                status,
                error
        );

        repository.save(log);
    }
}