package com.roomify.backend.repository;

import com.roomify.backend.entity.InvoiceDeliveryLog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceDeliveryLogRepository extends JpaRepository<InvoiceDeliveryLog, Long> {

    Optional<InvoiceDeliveryLog> findFirstByConfirmationNumberOrderByCreatedAtDesc(String confirmationNumber);

    Optional<InvoiceDeliveryLog> findFirstByConfirmationNumberAndSubjectOrderByCreatedAtDesc(
            String confirmationNumber,
            String subject);
}
