package com.roomify.backend.repository;

import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    long countByReservation_ConfirmationNumber(String confirmationNumber);

    Optional<Payment> findTopByReservation_IdOrderByCreatedAtDesc(Long reservationId);

    List<Payment> findByReservation_IdOrderByCreatedAtDesc(Long reservationId);

    List<Payment> findByReservation_Guest_EmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Payment> findByReservation_Guest_EmailIgnoreCaseOrderByCreatedAtDesc(String email, Pageable pageable);

    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(PaymentStatus status);

    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(PaymentStatus status, Pageable pageable);

    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT MIN(p.createdAt) FROM Payment p")
    LocalDateTime findMinimumCreatedAt();

    @Query("SELECT MAX(p.createdAt) FROM Payment p")
    LocalDateTime findMaximumCreatedAt();
}
