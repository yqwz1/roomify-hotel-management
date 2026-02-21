package com.roomify.backend.search;

import jakarta.validation.constraints.*;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Data-transfer object that defines the <strong>search request
 * contract</strong>
 * for the room-availability endpoint.
 *
 * <h2>Endpoint Contract (future: {@code GET /api/rooms/search})</h2>
 * <p>
 * Clients send this DTO (as query-parameters or a JSON body) to search for
 * available rooms within a date range, optionally filtering by room type, price
 * band, and guest capacity. Results can be sorted by price or room-type name.
 * </p>
 *
 * <h3>Required fields</h3>
 * <ul>
 * <li>{@code checkIn} — the first night of the stay (today or later)</li>
 * <li>{@code checkOut} — the departure date (must be strictly after
 * {@code checkIn})</li>
 * </ul>
 *
 * <h3>Optional filters</h3>
 * <ul>
 * <li>{@code roomType} — exact room-type name (e.g. "Deluxe", "Suite")</li>
 * <li>{@code minPrice} / {@code maxPrice} — base-price range filter</li>
 * <li>{@code guests} — minimum guest capacity the room type must support</li>
 * </ul>
 *
 * <h3>Sorting</h3>
 * <ul>
 * <li>{@code sortBy} — which field to sort on (default:
 * {@link SearchSortField#PRICE})</li>
 * <li>{@code sortDirection} — {@code ASC} or {@code DESC} (default:
 * {@code ASC})</li>
 * </ul>
 *
 * <h3>Validation rules enforced by Jakarta Bean Validation</h3>
 * <ol>
 * <li>{@code checkIn} must be today or in the future
 * ({@code @FutureOrPresent}).</li>
 * <li>{@code checkOut} must be in the future ({@code @Future}).</li>
 * <li>{@code minPrice} and {@code maxPrice} must be {@code >= 0} when
 * provided.</li>
 * <li>{@code guests} must be {@code >= 1} when provided.</li>
 * </ol>
 *
 * <p>
 * The {@link #validate()} method performs cross-field validation that cannot
 * be expressed with annotations alone (e.g. {@code checkOut > checkIn},
 * {@code maxPrice >= minPrice}).
 * </p>
 *
 * @see SearchSortField
 * @see AvailabilityQueryStrategy
 */
public class RoomSearchRequest {

    // -----------------------------------------------------------------------
    // Required date-range fields
    // -----------------------------------------------------------------------

    /**
     * The first night of the requested stay.
     * Must be today or a future date.
     */
    @NotNull(message = "Check-in date is required")
    @FutureOrPresent(message = "Check-in date must be today or in the future")
    private LocalDate checkIn;

    /**
     * The departure date (exclusive — the guest leaves on this day).
     * Must be strictly after {@code checkIn}.
     */
    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOut;

    // -----------------------------------------------------------------------
    // Optional filter fields
    // -----------------------------------------------------------------------

    /**
     * Optional room-type name filter (e.g. "Deluxe", "Suite").
     * When {@code null}, rooms of all types are included.
     */
    private String roomType;

    /**
     * Optional lower bound for the room-type base price (inclusive).
     * Must be {@code >= 0} when provided.
     */
    @DecimalMin(value = "0.0", message = "Minimum price cannot be negative")
    private BigDecimal minPrice;

    /**
     * Optional upper bound for the room-type base price (inclusive).
     * Must be {@code >= 0} when provided.
     */
    @DecimalMin(value = "0.0", message = "Maximum price cannot be negative")
    private BigDecimal maxPrice;

    /**
     * Optional minimum guest capacity.
     * Only room types whose {@code maxGuests >= guestCapacity} will be returned.
     * Must be {@code >= 1} when provided.
     */
    @Min(value = 1, message = "Guest capacity must be at least 1")
    private Integer guestCapacity;

    // -----------------------------------------------------------------------
    // Sorting parameters
    // -----------------------------------------------------------------------

    /**
     * The field to sort results by.
     * Defaults to {@link SearchSortField#PRICE} when {@code null}.
     *
     * @see SearchSortField
     */
    private SearchSortField sortBy;

    /**
     * The sort direction ({@code ASC} or {@code DESC}).
     * Defaults to {@link Sort.Direction#ASC} when {@code null}.
     */
    private Sort.Direction sortDirection;

    // -----------------------------------------------------------------------
    // Constructors
    // -----------------------------------------------------------------------

    public RoomSearchRequest() {
    }

    public RoomSearchRequest(LocalDate checkIn, LocalDate checkOut, String roomType,
            BigDecimal minPrice, BigDecimal maxPrice, Integer guestCapacity,
            SearchSortField sortBy, Sort.Direction sortDirection) {
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.roomType = roomType;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.guestCapacity = guestCapacity;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    // -----------------------------------------------------------------------
    // Cross-field validation
    // -----------------------------------------------------------------------

    /**
     * Performs cross-field validation that Jakarta annotations cannot express.
     *
     * <p>
     * This method should be called <em>after</em> Bean Validation passes and
     * before the request is handed to the query layer.
     * </p>
     *
     * <p>
     * <strong>Rules checked:</strong>
     * </p>
     * <ol>
     * <li>{@code checkOut} must be strictly after {@code checkIn}.</li>
     * <li>If both {@code minPrice} and {@code maxPrice} are provided,
     * {@code maxPrice} must be greater than or equal to {@code minPrice}.</li>
     * </ol>
     *
     * @throws IllegalArgumentException if any cross-field rule is violated
     */
    public void validate() {
        if (checkIn != null && checkOut != null && !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException(
                    "Check-out date must be after check-in date");
        }
        if (minPrice != null && maxPrice != null && maxPrice.compareTo(minPrice) < 0) {
            throw new IllegalArgumentException(
                    "Maximum price must be greater than or equal to minimum price");
        }
    }

    // -----------------------------------------------------------------------
    // Default-aware accessors for sorting
    // -----------------------------------------------------------------------

    /**
     * Returns the effective sort field, falling back to
     * {@link SearchSortField#PRICE} when none was specified.
     *
     * @return the sort field to use, never {@code null}
     */
    public SearchSortField getEffectiveSortBy() {
        return sortBy != null ? sortBy : SearchSortField.PRICE;
    }

    /**
     * Returns the effective sort direction, falling back to
     * {@link Sort.Direction#ASC} when none was specified.
     *
     * @return the sort direction to use, never {@code null}
     */
    public Sort.Direction getEffectiveSortDirection() {
        return sortDirection != null ? sortDirection : Sort.Direction.ASC;
    }

    // -----------------------------------------------------------------------
    // Getters and Setters
    // -----------------------------------------------------------------------

    public LocalDate getCheckIn() {
        return checkIn;
    }

    public void setCheckIn(LocalDate checkIn) {
        this.checkIn = checkIn;
    }

    public LocalDate getCheckOut() {
        return checkOut;
    }

    public void setCheckOut(LocalDate checkOut) {
        this.checkOut = checkOut;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public Integer getGuestCapacity() {
        return guestCapacity;
    }

    public void setGuestCapacity(Integer guestCapacity) {
        this.guestCapacity = guestCapacity;
    }

    public SearchSortField getSortBy() {
        return sortBy;
    }

    public void setSortBy(SearchSortField sortBy) {
        this.sortBy = sortBy;
    }

    public Sort.Direction getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(Sort.Direction sortDirection) {
        this.sortDirection = sortDirection;
    }
}
