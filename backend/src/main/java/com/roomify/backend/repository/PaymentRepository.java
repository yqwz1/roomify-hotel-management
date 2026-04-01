package com.roomify.backend.repository;

import com.roomify.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    long countByReservation_ConfirmationNumber(String confirmationNumber);
}
