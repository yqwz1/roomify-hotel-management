package com.roomify.backend.search;

/**
 * Defines the fields that room search results can be sorted by.
 *
 * <p>
 * Each constant carries a {@code columnExpression} that maps directly to the
 * JPQL / SQL column reference used in an {@code ORDER BY} clause. This keeps
 * the sort logic decoupled from the controller layer and makes it easy to
 * extend
 * with new sortable fields in the future.
 * </p>
 *
 * <h3>Usage example (pseudo-code)</h3>
 * 
 * <pre>{@code
 * SearchSortField field = request.getSortBy(); // e.g. PRICE
 * String orderBy = "ORDER BY " + field.getColumn()
 *         + " " + request.getSortDirection(); // e.g. "ORDER BY rt.basePrice ASC"
 * }</pre>
 *
 * @see RoomSearchRequest
 */
public enum SearchSortField {

    /**
     * Sort by the room-type base price ({@code room_types.base_price}).
     * <p>
     * Maps to JPQL expression {@code rt.basePrice} where {@code rt} is the
     * {@code RoomType} alias in the availability query.
     * </p>
     */
    PRICE("rt.basePrice"),

    /**
     * Sort by the room-type name ({@code room_types.name}).
     * <p>
     * Maps to JPQL expression {@code rt.name} where {@code rt} is the
     * {@code RoomType} alias in the availability query.
     * </p>
     */
    ROOM_TYPE("rt.name");

    // ---------------------------------------------------------------------------
    // Instance state
    // ---------------------------------------------------------------------------

    /**
     * The JPQL column expression used in the {@code ORDER BY} clause.
     */
    private final String column;

    // ---------------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------------

    SearchSortField(String column) {
        this.column = column;
    }

    // ---------------------------------------------------------------------------
    // Accessor
    // ---------------------------------------------------------------------------

    /**
     * Returns the JPQL column expression for this sort field.
     *
     * @return a non-null JPQL expression such as {@code "rt.basePrice"}
     */
    public String getColumn() {
        return column;
    }
}
