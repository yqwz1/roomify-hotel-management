package com.roomify.backend.repository;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Static factory for Reservation {@link Specification} predicates.
 *
 * Replaces the previous {@code findForReport} JPQL query that received
 * {@code status} as a raw {@code String} to work around JPQL Enum constraints.
 * Using the Criteria API here ensures:
 * <ul>
 *   <li>Type safety — {@link ReservationStatus} is passed as an Enum, not a String.</li>
 *   <li>Composability — predicates are combined with {@code and()} in the service.</li>
 *   <li>Correctness — {@code null} filters are naturally excluded without JPQL hacks.</li>
 * </ul>
 *
 * Usage in service:
 * <pre>{@code
 * Specification<Reservation> spec = DashboardSpecification.build(start, end, status, roomTypeId);
 * repository.findAll(spec, PageRequest.of(page, size, sort));
 * }</pre>
 */
public final class DashboardSpecification {

    private DashboardSpecification() {
        // utility class — no instances
    }

    /**
     * Build a composite Specification by combining all active (non-null) predicates.
     * This is the primary entry point for the service layer.
     *
     * @param start      period start date (inclusive), required
     * @param end        period end date (inclusive), required
     * @param status     optional enum filter; {@code null} means "all statuses"
     * @param roomTypeId optional room-type ID filter; {@code null} means "all types"
     * @return composed Specification ready for use with {@link DashboardRepository#findAll}
     */
    public static Specification<Reservation> build(
            LocalDate start,
            LocalDate end,
            ReservationStatus status,
            Long roomTypeId) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Date range: checkInDate in [start, end]
            predicates.add(cb.greaterThanOrEqualTo(root.get("checkInDate"), start));
            predicates.add(cb.lessThanOrEqualTo(root.get("checkInDate"), end));

            // Optional status filter — Enum is passed directly (type-safe, no String cast)
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Optional room-type filter via joined path
            if (roomTypeId != null) {
                predicates.add(
                    cb.equal(root.get("room").get("roomType").get("id"), roomTypeId)
                );
            }

            // Default sort: checkInDate ASC (applied via Sort in the service — see below)
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
