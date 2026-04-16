package com.roomify.backend.repository;

import com.roomify.backend.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.roomify.backend.dto.EmailDeliveryStatus;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    boolean existsByConfirmationNumberAndSubjectAndStatus(String confirmationNumber, String subject, EmailDeliveryStatus status);
}