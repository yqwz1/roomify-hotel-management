package com.roomify.backend.service;

import com.roomify.backend.dto.RoomResponse;
import com.roomify.backend.dto.RoomSearchResponse;
import com.roomify.backend.dto.RoomTypeResponse;
import com.roomify.backend.entity.Room;
import com.roomify.backend.search.AvailabilityQueryStrategy;
import com.roomify.backend.search.RoomSearchRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service that executes room availability searches.
 *
 * <p>
 * Uses {@link AvailabilityQueryStrategy} to build dynamic JPQL queries
 * and the JPA {@link EntityManager} to execute them against the database.
 * </p>
 *
 * <h3>Flow</h3>
 * <ol>
 * <li>Validate the request (cross-field rules like checkOut &gt; checkIn)</li>
 * <li>Build the JPQL query from the validated request</li>
 * <li>Bind required and optional parameters</li>
 * <li>Execute the query and map results to response DTOs</li>
 * </ol>
 *
 * @see AvailabilityQueryStrategy
 * @see RoomSearchRequest
 */
@Service
public class RoomSearchService {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Searches for available rooms matching the given criteria.
     *
     * @param request the validated search request
     * @return a response containing matching rooms and total count
     * @throws IllegalArgumentException if cross-field validation fails
     *                                  (e.g. checkOut ≤ checkIn, maxPrice &lt;
     *                                  minPrice)
     */
    public RoomSearchResponse searchAvailableRooms(RoomSearchRequest request) {
        // 1. Cross-field validation (checkOut > checkIn, maxPrice >= minPrice)
        request.validate();

        // 2. Build JPQL query from the strategy
        String jpql = AvailabilityQueryStrategy.buildAvailabilityQuery(request);

        // 3. Create typed query
        TypedQuery<Room> query = entityManager.createQuery(jpql, Room.class);

        // 4. Bind required parameters (always present)
        query.setParameter("checkIn", request.getCheckIn());
        query.setParameter("checkOut", request.getCheckOut());

        // 5. Bind optional parameters (only when the filter is set)
        if (request.getRoomType() != null && !request.getRoomType().isBlank()) {
            query.setParameter("roomTypeName", request.getRoomType());
        }
        if (request.getMinPrice() != null) {
            query.setParameter("minPrice", request.getMinPrice());
        }
        if (request.getMaxPrice() != null) {
            query.setParameter("maxPrice", request.getMaxPrice());
        }
        if (request.getGuests() != null) {
            query.setParameter("guests", request.getGuests());
        }

        // 6. Execute and map to DTOs
        List<Room> rooms = query.getResultList();

        List<RoomResponse> roomResponses = rooms.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new RoomSearchResponse(roomResponses, roomResponses.size());
    }

    /**
     * Converts a Room entity to its response DTO.
     */
    private RoomResponse toResponse(Room room) {
        var roomType = room.getRoomType();
        RoomTypeResponse roomTypeResponse = new RoomTypeResponse(
                roomType.getId(),
                roomType.getName(),
                roomType.getBasePrice(),
                roomType.getMaxGuests(),
                roomType.getAmenities(),
                roomType.getDescription());

        return new RoomResponse(
                room.getId(),
                room.getRoomNumber(),
                roomTypeResponse,
                room.getFloor(),
                room.getStatus());
    }
}
