package com.roomify.backend.service;

import com.roomify.backend.entity.EmailLog;
import com.roomify.backend.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailLogService {

    private final EmailLogRepository repository;

    public void log(String recipient, String subject, String status, String errorMessage) {

        EmailLog log = EmailLog.builder()
                .recipient(recipient)
                .subject(subject)
                .status(status)
                .errorMessage(errorMessage)
                .createdAt(LocalDateTime.now())
                .build();

        repository.save(log);
    }
}