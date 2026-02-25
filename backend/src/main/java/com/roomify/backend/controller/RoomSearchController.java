package com.roomify.backend.controller;

import com.roomify.backend.dto.RoomSearchResponse;
import com.roomify.backend.search.RoomSearchRequest;
import com.roomify.backend.service.RoomSearchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for searching available rooms.
 *
 * <p>
 * This endpoint is publicly accessible (no authentication required)
 * so that guests can search for rooms before logging in or creating
 * an account.
 * </p>
 *
 * <h3>Endpoint</h3>
 * 
 * <pre>
 * GET /api/rooms/search?checkIn=2026-03-01&amp;checkOut=2026-03-05&amp;roomType=Deluxe&amp;guests=2
 * </pre>
 *
 * @see RoomSearchRequest for all available query parameters
 * @see RoomSearchService for the search logic
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomSearchController {

    private final RoomSearchService roomSearchService;

    public RoomSearchController(RoomSearchService roomSearchService) {
        this.roomSearchService = roomSearchService;
    }

    /**
     * Search for available rooms within a date range with optional filters.
     *
     * <p>
     * Accepts query parameters that map to {@link RoomSearchRequest}:
     * <ul>
     * <li>{@code checkIn} — first night (required, today or future)</li>
     * <li>{@code checkOut} — departure date (required, must be after checkIn)</li>
     * <li>{@code roomType} — filter by room type name (optional)</li>
     * <li>{@code minPrice} / {@code maxPrice} — price range filter (optional)</li>
     * <li>{@code guests} — minimum guest capacity (optional)</li>
     * <li>{@code sortBy} — PRICE or ROOM_TYPE (optional, default: PRICE)</li>
     * <li>{@code sortDirection} — ASC or DESC (optional, default: ASC)</li>
     * </ul>
     *
     * @param request the validated search request bound from query parameters
     * @return available rooms matching the criteria
     */
    @GetMapping("/search")
    public ResponseEntity<RoomSearchResponse> searchAvailableRooms(
            @Valid @ModelAttribute RoomSearchRequest request) {
        RoomSearchResponse response = roomSearchService.searchAvailableRooms(request);
        return ResponseEntity.ok(response);
    }
}
