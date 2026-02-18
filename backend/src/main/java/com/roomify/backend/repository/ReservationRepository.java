package com.roomify.backend.repository;

import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Reservation entity.
 */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /**
     * Find all reservations for a specific guest.
     * 
     * @param guest the guest
     * @return list of reservations
     */
    List<Reservation> findByGuest(Guest guest);

    /**
     * Find all reservations for a specific room.
     * 
     * @param room the room
     * @return list of reservations
     */
    List<Reservation> findByRoom(Room room);

    /**
     * Find a reservation by its confirmation number.
     * 
     * @param confirmationNumber the confirmation number
     * @return Optional containing the reservation if found
     */
    Optional<Reservation> findByConfirmationNumber(String confirmationNumber);

    /**
     * Find all reservations with a specific status.
     * 
     * @param status the reservation status
     * @return list of reservations
     */
    List<Reservation> findByStatus(ReservationStatus status);
}
