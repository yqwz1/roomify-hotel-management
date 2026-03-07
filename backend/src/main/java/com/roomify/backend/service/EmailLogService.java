package com.roomify.backend.service;

import com.roomify.backend.dto.EmailDeliveryStatus;
import com.roomify.backend.entity.EmailLog;
import com.roomify.backend.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailLogService {

    private final EmailLogRepository repository;

    public void log(String to,
                    String subject,
                    EmailDeliveryStatus status,
                    String error,
                    String confirmationNumber) {

        EmailLog log = new EmailLog(
                to,
                subject,
                status,
                error,
                confirmationNumber
        );

        repository.save(log);
    }
}