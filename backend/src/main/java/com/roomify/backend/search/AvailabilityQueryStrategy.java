package com.roomify.backend.search;

import org.springframework.data.domain.Sort;

/**
 * Drafts the <strong>JPQL query strategy</strong> for finding available rooms
 * within a requested date range, subject to optional filters and sorting.
 *
 * <h2>Design Intent</h2>
 * <p>
 * This class is a <em>pure strategy draft</em> — it is <strong>not</strong> a
 * Spring bean and has no dependencies on the persistence layer. Its purpose is
 * to encapsulate and document the query logic so that it can later be
 * integrated into a {@code @Repository} or {@code @Service} with minimal
 * effort.
 * </p>
 *
 * <h2>Query Logic Overview</h2>
 * <ol>
 * <li><strong>Base selection</strong> — select rooms joined with their
 * {@code RoomType}.</li>
 * <li><strong>Status filter</strong> — only rooms whose status is
 * {@code AVAILABLE} are included. Rooms with statuses
 * {@code OCCUPIED}, {@code MAINTENANCE}, or {@code OUT_OF_SERVICE}
 * are explicitly excluded.</li>
 * <li><strong>Reservation overlap exclusion</strong> — any room that has an
 * existing reservation whose date range overlaps with the requested
 * {@code [checkIn, checkOut)} interval is excluded. The overlap
 * condition used is the standard half-open interval test:
 * 
 * <pre>{@code reservation.checkIn < :checkOut AND reservation.checkOut > :checkIn}</pre>
 * 
 * This correctly detects all four overlap cases (partial before, partial
 * after, fully contained, fully containing).</li>
 * <li><strong>Optional filters</strong> — room-type name, price range, and
 * guest capacity are applied only when the caller supplies them.</li>
 * <li><strong>Sorting</strong> — results are ordered by the field and
 * direction specified in the {@link RoomSearchRequest}.</li>
 * </ol>
 *
 * <h2>Overlap Exclusion — Detailed Explanation</h2>
 * <p>
 * Given a requested stay {@code [checkIn, checkOut)} and an existing
 * reservation {@code [resIn, resOut)}, the reservation <em>overlaps</em> if
 * and only if:
 * </p>
 * 
 * <pre>{@code   resIn < checkOut  AND  resOut > checkIn}</pre>
 *
 * <p>
 * Visual examples (time flows left → right):
 * </p>
 * 
 * <pre>
 *   Requested:        |----checkIn====checkOut----|
 *
 *   Case 1 – partial overlap (before):
 *       |---resIn===resOut---|
 *       resIn < checkOut ✔   resOut > checkIn ✔  → OVERLAP
 *
 *   Case 2 – partial overlap (after):
 *                               |---resIn===resOut---|
 *       resIn < checkOut ✔   resOut > checkIn ✔  → OVERLAP
 *
 *   Case 3 – reservation contains request:
 *     |-------resIn====================resOut-------|
 *       resIn < checkOut ✔   resOut > checkIn ✔  → OVERLAP
 *
 *   Case 4 – request contains reservation:
 *              |--resIn==resOut--|
 *       resIn < checkOut ✔   resOut > checkIn ✔  → OVERLAP
 *
 *   Case 5 – no overlap (reservation ends before request):
 *   |--resIn==resOut--|
 *       resIn < checkOut ✔   resOut > checkIn ✗  → NO OVERLAP ✔
 *
 *   Case 6 – no overlap (reservation starts after request):
 *                                        |--resIn==resOut--|
 *       resIn < checkOut ✗   resOut > checkIn ✔  → NO OVERLAP ✔
 * </pre>
 *
 * <p>
 * The query uses a {@code NOT EXISTS} sub-select so that a room is returned
 * only when <em>no</em> overlapping reservation exists.
 * </p>
 *
 * @see RoomSearchRequest
 * @see SearchSortField
 */
public class AvailabilityQueryStrategy {

    // -----------------------------------------------------------------------
    // Prevent instantiation — all methods are static
    // -----------------------------------------------------------------------

    private AvailabilityQueryStrategy() {
        // Utility class — not meant to be instantiated.
    }

    // -----------------------------------------------------------------------
    // Query builder
    // -----------------------------------------------------------------------

    /**
     * Builds a JPQL query string that returns available {@code Room} entities
     * matching the criteria in the supplied {@link RoomSearchRequest}.
     *
     * <h3>Parameters the generated query expects</h3>
     * <table>
     * <tr>
     * <th>Parameter</th>
     * <th>Type</th>
     * <th>Always bound?</th>
     * </tr>
     * <tr>
     * <td>{@code :checkIn}</td>
     * <td>{@code LocalDate}</td>
     * <td>Yes</td>
     * </tr>
     * <tr>
     * <td>{@code :checkOut}</td>
     * <td>{@code LocalDate}</td>
     * <td>Yes</td>
     * </tr>
     * <tr>
     * <td>{@code :roomTypeName}</td>
     * <td>{@code String}</td>
     * <td>Only when filter is set</td>
     * </tr>
     * <tr>
     * <td>{@code :minPrice}</td>
     * <td>{@code BigDecimal}</td>
     * <td>Only when filter is set</td>
     * </tr>
     * <tr>
     * <td>{@code :maxPrice}</td>
     * <td>{@code BigDecimal}</td>
     * <td>Only when filter is set</td>
     * </tr>
     * <tr>
     * <td>{@code :guests}</td>
     * <td>{@code Integer}</td>
     * <td>Only when filter is set</td>
     * </tr>
     * </table>
     *
     * <h3>Implementation notes for future integration</h3>
     * <ul>
     * <li>The {@code Reservation} entity uses fields {@code checkInDate}
     * (LocalDate) and {@code checkOutDate} (LocalDate), with a
     * {@code room} (ManyToOne → Room) relation and a {@code status}
     * (ReservationStatus) field.</li>
     * <li>The query intentionally uses a {@code NOT EXISTS} sub-select rather
     * than a {@code LEFT JOIN … IS NULL} approach because it is
     * semantically clearer and typically performs equally well on modern
     * RDBMS engines with an indexed reservation table.</li>
     * <li>Cancelled reservations ({@code CANCELLED} status) are excluded
     * from the overlap check since they no longer block availability.</li>
     * <li>The sorting clause is appended dynamically using
     * {@link SearchSortField#getColumn()} and the request's sort direction.</li>
     * </ul>
     *
     * @param request the validated search request (must not be {@code null})
     * @return a JPQL query string ready to be used with
     *         {@code EntityManager.createQuery()} after binding parameters
     * @throws IllegalArgumentException if {@code request} is {@code null}
     */
    public static String buildAvailabilityQuery(RoomSearchRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Search request must not be null");
        }

        StringBuilder jpql = new StringBuilder();

        // ------------------------------------------------------------------
        // 1. BASE SELECT — join Room with its RoomType
        // ------------------------------------------------------------------
        jpql.append("SELECT r FROM Room r ");
        jpql.append("JOIN r.roomType rt ");

        // ------------------------------------------------------------------
        // 2. WHERE clause — always-applied predicates
        // ------------------------------------------------------------------
        jpql.append("WHERE ");

        /*
         * STATUS FILTER
         * ─────────────
         * Only rooms whose current status is AVAILABLE are eligible for
         * booking. All other statuses (OCCUPIED, MAINTENANCE, OUT_OF_SERVICE)
         * are non-bookable and must be excluded.
         *
         * Rationale: Even though a room might become AVAILABLE by the
         * requested check-in date, the current status reflects operational
         * reality and the search should respect it. A future enhancement
         * could introduce a "projected status" concept.
         */
        jpql.append("r.status = com.roomify.backend.entity.RoomStatus.AVAILABLE ");

        /*
         * RESERVATION OVERLAP EXCLUSION
         * ─────────────────────────────
         * Exclude any room that has at least one active reservation overlapping
         * the requested [checkIn, checkOut) interval.
         *
         * Overlap condition (half-open intervals):
         * existing.checkInDate < :checkOut
         * existing.checkOutDate > :checkIn
         *
         * We negate this with NOT EXISTS so that only rooms with ZERO
         * overlapping active reservations are returned.
         *
         * Only active reservation lifecycle states block availability.
         * Terminal states such as cancelled, no-show, refunded, checked-out,
         * and completed no longer hold the room.
         */
        jpql.append("AND NOT EXISTS (");
        jpql.append("SELECT 1 FROM Reservation res ");
        jpql.append("WHERE res.room = r ");
        jpql.append("AND res.status IN :blockingStatuses ");
        jpql.append("AND res.checkInDate < :checkOut ");
        jpql.append("AND res.checkOutDate > :checkIn");
        jpql.append(") ");

        // ------------------------------------------------------------------
        // 3. OPTIONAL FILTERS — appended only when the caller provides them
        // ------------------------------------------------------------------

        /*
         * ROOM NAME / NUMBER FILTER
         * Match either the room number or the room-type name, case-insensitively.
         */
        if (request.getRoomName() != null && !request.getRoomName().isBlank()) {
            jpql.append("AND (LOWER(r.roomNumber) LIKE :roomName OR LOWER(rt.name) LIKE :roomName) ");
        }

        /*
         * ROOM TYPE NAME FILTER
         * Filter by exact room-type name (case-sensitive).
         * Example: "Deluxe", "Suite", "Standard".
         */
        if (request.getRoomType() != null && !request.getRoomType().isBlank()) {
            jpql.append("AND rt.name = :roomTypeName ");
        }

        /*
         * MINIMUM PRICE FILTER
         * Only include room types whose basePrice >= :minPrice.
         */
        if (request.getMinPrice() != null) {
            jpql.append("AND rt.basePrice >= :minPrice ");
        }

        /*
         * MAXIMUM PRICE FILTER
         * Only include room types whose basePrice <= :maxPrice.
         */
        if (request.getMaxPrice() != null) {
            jpql.append("AND rt.basePrice <= :maxPrice ");
        }

        /*
         * GUEST CAPACITY FILTER
         * Only include room types whose maxGuests >= :guests,
         * ensuring the room can accommodate the requested party size.
         */
        if (request.getGuestCapacity() != null) {
            jpql.append("AND rt.maxGuests >= :guests ");
        }

        // ------------------------------------------------------------------
        // 4. SORTING — dynamic ORDER BY based on request parameters
        // ------------------------------------------------------------------

        /*
         * DEFAULT SORTING
         * ───────────────
         * If no sort field is specified, results are sorted by price
         * ascending (cheapest first), which is the most common guest
         * expectation.
         *
         * Clients can override this by setting sortBy and sortDirection
         * to any combination of SearchSortField × Sort.Direction.
         */
        SearchSortField sortField = request.getEffectiveSortBy();
        Sort.Direction sortDir = request.getEffectiveSortDirection();

        jpql.append("ORDER BY ");
        jpql.append(sortField.getColumn());
        jpql.append(" ");
        jpql.append(sortDir.name());

        return jpql.toString();
    }
}
