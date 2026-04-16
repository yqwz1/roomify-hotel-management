package com.roomify.backend.repository;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

/**
 * Shared reservation list filters for repository and service entry points.
 * Guest-name searches are intentionally ordered so ambiguous matches are stable
 * and the UI can present a predictable selection list.
 */
public final class ReservationSpecification {

    private ReservationSpecification() {
        // utility class
    }

    public static Specification<Reservation> build(
            String confirmation,
            String guestName,
            ReservationStatus status,
            LocalDate checkInDate,
            LocalDate checkOutDate) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (confirmation != null) {
                predicates.add(cb.equal(cb.upper(root.get("confirmationNumber")), confirmation));
            }

            if (guestName != null) {
                predicates.add(cb.like(
                        cb.lower(root.join("guest").get("name")),
                        "%" + guestName.toLowerCase(Locale.ROOT) + "%"));
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Sort filteredSort() {
        return Sort.by(
                Sort.Order.desc("checkInDate"),
                Sort.Order.asc("confirmationNumber"));
    }
}
