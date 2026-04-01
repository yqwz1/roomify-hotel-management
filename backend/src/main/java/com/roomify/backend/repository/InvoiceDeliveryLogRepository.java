package com.roomify.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomify.backend.entity.InvoiceDeliveryLog;

public interface InvoiceDeliveryLogRepository
        extends JpaRepository<InvoiceDeliveryLog, Long> {
}