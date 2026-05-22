package com.roomify.backend.repository;

import com.roomify.backend.entity.ReservationHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservationHistoryRepository extends JpaRepository<ReservationHistory, Long> {

    List<ReservationHistory> findByReservation_IdOrderByChangedAtAsc(Long reservationId);
}
