package com.roomify.backend.repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.LockModeType;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {

        @EntityGraph(attributePaths = { "room", "room.roomType", "guest" })
        @Query("SELECT r FROM Reservation r")
        List<Reservation> findAllWithDetails();

        @EntityGraph(attributePaths = { "room", "room.roomType", "guest" })
        @Query("SELECT r FROM Reservation r " +
                        "WHERE r.checkOutDate > :start AND r.checkInDate <= :end")
        List<Reservation> findAllOverlappingPeriodWithDetails(
                        @Param("start") LocalDate start,
                        @Param("end") LocalDate end);

        @Query("SELECT MIN(r.checkInDate) FROM Reservation r")
        LocalDate findMinimumCheckInDate();

        @Query("SELECT MAX(r.checkOutDate) FROM Reservation r")
        LocalDate findMaximumCheckOutDate();

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
                Specification<Reservation> specification = (root, query, cb) -> {
                        List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

                        if (confirmation != null) {
                                predicates.add(cb.equal(cb.upper(root.get("confirmationNumber")), confirmation));
                        }

                        if (guestName != null) {
                                query.distinct(true);

                                List<String> guestTokens = Arrays.stream(guestName.trim().split("\\s+"))
                                                .filter(token -> !token.isBlank())
                                                .map(token -> token.toLowerCase(Locale.ROOT))
                                                .toList();

                                if (!guestTokens.isEmpty()) {
                                        Join<Object, Object> guest = root.join("guest");
                                        guestTokens.forEach(token -> predicates.add(cb.like(
                                                        cb.lower(guest.get("name")),
                                                        "%" + token + "%")));
                                }
                        }

                        if (status != null) {
                                predicates.add(cb.equal(root.get("status"), status));
                        }

                        if (checkInDate != null) {
                                predicates.add(cb.equal(root.get("checkInDate"), checkInDate));
                        }

                        if (checkOutDate != null) {
                                predicates.add(cb.equal(root.get("checkOutDate"), checkOutDate));
                        }

                        return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
                };

                boolean hasActiveFilters = confirmation != null
                                || guestName != null
                                || status != null
                                || checkInDate != null
                                || checkOutDate != null;

                if (hasActiveFilters) {
                        return findAll(specification, Sort.by(
                                        Sort.Order.desc("checkInDate"),
                                        Sort.Order.asc("confirmationNumber")));
                }

                return findAll(specification);
        }

        @EntityGraph(attributePaths = { "room", "room.roomType", "guest" })
        @Query("SELECT r FROM Reservation r " +
                        "WHERE r.status IN (com.roomify.backend.entity.ReservationStatus.PENDING, " +
                        "                   com.roomify.backend.entity.ReservationStatus.PAYMENT_PENDING, " +
                        "                   com.roomify.backend.entity.ReservationStatus.CONFIRMED, " +
                        "                   com.roomify.backend.entity.ReservationStatus.CHECKED_IN) " +
                        "AND r.checkInDate < :end AND r.checkOutDate > :start " +
                        "ORDER BY r.checkInDate ASC")
        List<Reservation> findActiveOverlappingForGrid(
                        @Param("start") LocalDate start,
                        @Param("end") LocalDate end);

        default List<Reservation> findOverlappingReservations(Long roomId, LocalDate newIn, LocalDate newOut) {
                return findOverlappingReservationsByStatuses(
                                roomId,
                                newIn,
                                newOut,
                                ReservationStatus.availabilityBlockingStatuses());
        }

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId " +
                        "AND r.status IN :blockingStatuses " +
                        "AND (:newIn < r.checkOutDate AND :newOut > r.checkInDate)")
        List<Reservation> findOverlappingReservationsByStatuses(
                        @Param("roomId") Long roomId,
                        @Param("newIn") LocalDate newIn,
                        @Param("newOut") LocalDate newOut,
                        @Param("blockingStatuses") Set<ReservationStatus> blockingStatuses);

        default boolean existsOverlapForAvailability(Long roomId, LocalDate newIn, LocalDate newOut) {
                return existsOverlapForAvailabilityByStatuses(
                                roomId,
                                newIn,
                                newOut,
                                ReservationStatus.availabilityBlockingStatuses());
        }

        @Query("SELECT COUNT(r) > 0 FROM Reservation r WHERE r.room.id = :roomId " +
                        "AND r.status IN :blockingStatuses " +
                        "AND (:newIn < r.checkOutDate AND :newOut > r.checkInDate)")
        boolean existsOverlapForAvailabilityByStatuses(
                        @Param("roomId") Long roomId,
                        @Param("newIn") LocalDate newIn,
                        @Param("newOut") LocalDate newOut,
                        @Param("blockingStatuses") Set<ReservationStatus> blockingStatuses);

        default List<Reservation> findOverlappingForUpdate(
                        Long roomId,
                        LocalDate newIn,
                        LocalDate newOut,
                        Long currentId) {
                return findOverlappingForUpdateByStatuses(
                                roomId,
                                newIn,
                                newOut,
                                currentId,
                                ReservationStatus.availabilityBlockingStatuses());
        }

        @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId " +
                        "AND r.id <> :currentId " +
                        "AND r.status IN :blockingStatuses " +
                        "AND (:newIn < r.checkOutDate AND :newOut > r.checkInDate)")
        List<Reservation> findOverlappingForUpdateByStatuses(
                        @Param("roomId") Long roomId,
                        @Param("newIn") LocalDate newIn,
                        @Param("newOut") LocalDate newOut,
                        @Param("currentId") Long currentId,
                        @Param("blockingStatuses") Set<ReservationStatus> blockingStatuses);

        @EntityGraph(attributePaths = { "room", "room.roomType", "guest" })
        List<Reservation> findAllByCheckInDateAndStatusIn(LocalDate checkInDate, Collection<ReservationStatus> statuses);

        @EntityGraph(attributePaths = { "room", "room.roomType", "guest" })
        @Query("""
                        select r from Reservation r
                        where r.status in :statuses
                          and r.outstandingBalance > 0
                          and r.checkOutDate > :today
                          and r.checkInDate <= :latestCheckIn
                        order by r.checkInDate asc
                        """)
        List<Reservation> findOutstandingReservationsForReminder(
                        @Param("statuses") Collection<ReservationStatus> statuses,
                        @Param("today") LocalDate today,
                        @Param("latestCheckIn") LocalDate latestCheckIn);

        @EntityGraph(attributePaths = { "room", "room.roomType", "guest" })
        @Query("""
                        select r from Reservation r
                        where r.room.id = :roomId
                          and r.status in :statuses
                          and r.checkOutDate >= :today
                        order by r.checkInDate asc
                        """)
        List<Reservation> findUpcomingReservationsForRoom(
                        @Param("roomId") Long roomId,
                        @Param("statuses") Collection<ReservationStatus> statuses,
                        @Param("today") LocalDate today);
}
