package com.roomify.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;

import jakarta.persistence.LockModeType;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

        Optional<Reservation> findByConfirmationNumber(String confirmationNumber);

        boolean existsByConfirmationNumber(String confirmationNumber);

        List<Reservation> findByGuest_Id(Long guestId);

        List<Reservation> findByRoom_Id(Long roomId);

        /**
         * Case-insensitive partial match on the guest's name.
         * Used by the staff lookup endpoint when searching by guest name.
         */
        @Query("SELECT r FROM Reservation r JOIN r.guest g " +
                        "WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :name, '%'))")
        List<Reservation> findByGuestNameContainingIgnoreCase(@Param("name") String name);

        @Query("""
                        SELECT r
                        FROM Reservation r
                        JOIN r.guest g
                        WHERE (:confirmation IS NULL OR UPPER(r.confirmationNumber) = :confirmation)
                          AND (:guestName IS NULL OR LOWER(g.name) LIKE LOWER(CONCAT('%', :guestName, '%')))
                          AND (:status IS NULL OR r.status = :status)
                          AND (:checkInDate IS NULL OR r.checkInDate = :checkInDate)
                          AND (:checkOutDate IS NULL OR r.checkOutDate = :checkOutDate)
                        """)
        List<Reservation> findAllByOptionalFilters(
                        @Param("confirmation") String confirmation,
                        @Param("guestName") String guestName,
                        @Param("status") ReservationStatus status,
                        @Param("checkInDate") LocalDate checkInDate,
                        @Param("checkOutDate") LocalDate checkOutDate);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId " +
                        "AND r.status <> com.roomify.backend.entity.ReservationStatus.CANCELLED " +
                        "AND (:newIn < r.checkOutDate AND :newOut > r.checkInDate)")
        List<Reservation> findOverlappingReservations(
                        @Param("roomId") Long roomId,
                        @Param("newIn") LocalDate newIn,
                        @Param("newOut") LocalDate newOut);

        @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId " +
                        "AND r.id <> :currentId " +
                        "AND r.status <> com.roomify.backend.entity.ReservationStatus.CANCELLED " +
                        "AND (:newIn < r.checkOutDate AND :newOut > r.checkInDate)")
        List<Reservation> findOverlappingForUpdate(
                        @Param("roomId") Long roomId,
                        @Param("newIn") LocalDate newIn,
                        @Param("newOut") LocalDate newOut,
                        @Param("currentId") Long currentId);
}
