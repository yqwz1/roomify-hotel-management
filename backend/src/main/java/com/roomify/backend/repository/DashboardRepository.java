package com.roomify.backend.repository;

import com.roomify.backend.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for dashboard metrics and trend queries.
 *
 * Extends {@link JpaSpecificationExecutor} to enable type-safe, dynamic
 * filtering via the Criteria API (replaces the previous String-based
 * status hack in {@code findForReport}).
 *
 * All queries here are READ-ONLY aggregations — no writes.
 */
@Repository
public interface DashboardRepository
        extends JpaRepository<Reservation, Long>,
                JpaSpecificationExecutor<Reservation> {

    /**
     * Count all reservations whose check-in falls within [start, end].
     */
    @Query("SELECT COUNT(r) FROM Reservation r " +
           "WHERE r.checkInDate >= :start AND r.checkInDate <= :end")
    long countReservationsInPeriod(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /**
     * Count active reservations (CONFIRMED or CHECKED_IN) in the period.
     */
    @Query("SELECT COUNT(r) FROM Reservation r " +
           "WHERE r.status IN " +
           "(com.roomify.backend.entity.ReservationStatus.CONFIRMED, " +
           " com.roomify.backend.entity.ReservationStatus.CHECKED_IN) " +
           "AND r.checkInDate >= :start AND r.checkInDate <= :end")
    long countActiveReservationsInPeriod(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /**
     * Sum total revenue from non-cancelled reservations in the period.
     * Returns 0 via COALESCE when no rows match.
     */
    @Query("SELECT COALESCE(SUM(r.totalPrice), 0) FROM Reservation r " +
           "WHERE r.status <> com.roomify.backend.entity.ReservationStatus.CANCELLED " +
           "AND r.checkInDate >= :start AND r.checkInDate <= :end")
    BigDecimal sumRevenueInPeriod(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /**
     * Fetch [checkInDate, checkOutDate] pairs for non-cancelled reservations
     * in the period so the service layer can calculate average stay nights
     * using {@link java.time.temporal.ChronoUnit#DAYS} — fully portable,
     * no database-specific DATEDIFF / DATE_PART function required.
     *
     * @param start period start (inclusive)
     * @param end   period end (inclusive)
     * @return list of Object[]{LocalDate checkIn, LocalDate checkOut}
     */
    @Query("SELECT r.checkInDate, r.checkOutDate FROM Reservation r " +
           "WHERE r.status <> com.roomify.backend.entity.ReservationStatus.CANCELLED " +
           "AND r.checkInDate >= :start AND r.checkInDate <= :end")
    List<Object[]> findStayDatesInPeriod(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /**
     * Count committed room nights on a specific date.
     * CHECKED_IN represents actual occupancy; CONFIRMED represents expected
     * occupancy for forward-looking dashboard charts.
     */
    @Query("SELECT COUNT(r) FROM Reservation r " +
           "WHERE r.status IN " +
           "(com.roomify.backend.entity.ReservationStatus.CONFIRMED, " +
           " com.roomify.backend.entity.ReservationStatus.CHECKED_IN) " +
           "AND r.checkInDate <= :date AND r.checkOutDate > :date")
    long countOccupiedRoomsOnDate(@Param("date") LocalDate date);

    /**
     * Aggregate daily revenue grouped by check-in date.
     *
     * Returns Object[] rows: [LocalDate checkInDate, BigDecimal sum, Long count]
     */
    @Query("SELECT r.checkInDate, SUM(r.totalPrice), COUNT(r) FROM Reservation r " +
           "WHERE r.status <> com.roomify.backend.entity.ReservationStatus.CANCELLED " +
           "AND r.checkInDate >= :start AND r.checkInDate <= :end " +
           "GROUP BY r.checkInDate ORDER BY r.checkInDate ASC")
    List<Object[]> findDailyRevenue(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /**
     * Count committed reservations belonging to a specific room type.
     */
    @Query("SELECT COUNT(r) FROM Reservation r " +
           "WHERE r.status IN " +
           "(com.roomify.backend.entity.ReservationStatus.CONFIRMED, " +
           " com.roomify.backend.entity.ReservationStatus.CHECKED_IN) " +
           "AND r.room.roomType.id = :roomTypeId")
    long countOccupiedRoomsByType(@Param("roomTypeId") Long roomTypeId);

    /**
     * Count distinct rooms of a type committed during a date range.
     * Uses active reservations overlapping [start, end].
     */
    @Query("SELECT COUNT(DISTINCT r.room.id) FROM Reservation r " +
           "WHERE r.status IN " +
           "(com.roomify.backend.entity.ReservationStatus.CONFIRMED, " +
           " com.roomify.backend.entity.ReservationStatus.CHECKED_IN) " +
           "AND r.room.roomType.id = :roomTypeId " +
           "AND r.checkInDate <= :end " +
           "AND r.checkOutDate > :start")
    long countOccupiedRoomsByTypeInPeriod(
            @Param("roomTypeId") Long roomTypeId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
