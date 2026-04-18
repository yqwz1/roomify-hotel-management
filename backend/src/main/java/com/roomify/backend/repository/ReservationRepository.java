package com.roomify.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;

import jakarta.persistence.LockModeType;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {

        Optional<Reservation> findByConfirmationNumber(String confirmationNumber);

        boolean existsByConfirmationNumber(String confirmationNumber);

        List<Reservation> findByGuest_Id(Long guestId);

        List<Reservation> findByRoom_Id(Long roomId);

        default List<Reservation> findAllByOptionalFilters(
                        String confirmation,
                        String guestName,
                        ReservationStatus status,
                        LocalDate checkInDate,
                        LocalDate checkOutDate) {
                var specification = ReservationSpecification.build(
                                confirmation,
                                guestName,
                                status,
                                checkInDate,
                                checkOutDate);

                if (guestName != null) {
                        return findAll(specification, ReservationSpecification.filteredSort());
                }

                return findAll(specification);
        }

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
