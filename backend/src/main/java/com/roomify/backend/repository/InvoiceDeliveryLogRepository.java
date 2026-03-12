package com.roomify.backend.repository;

import com.roomify.backend.entity.InvoiceDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceDeliveryLogRepository extends JpaRepository<InvoiceDeliveryLog, Long> {
}