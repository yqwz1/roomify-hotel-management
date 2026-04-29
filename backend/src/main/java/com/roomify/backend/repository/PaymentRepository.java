package com.roomify.backend.repository;

import com.roomify.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    long countByReservation_ConfirmationNumber(String confirmationNumber);

    @Query("SELECT MIN(p.createdAt) FROM Payment p")
    LocalDateTime findMinimumCreatedAt();

    @Query("SELECT MAX(p.createdAt) FROM Payment p")
    LocalDateTime findMaximumCreatedAt();
}
