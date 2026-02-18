package com.roomify.backend.repository;

import com.roomify.backend.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByConfirmationNumber(String confirmationNumber);

    boolean existsByConfirmationNumber(String confirmationNumber);

    List<Reservation> findByGuest_Id(Long guestId);

    List<Reservation> findByRoom_Id(Long roomId);
}
