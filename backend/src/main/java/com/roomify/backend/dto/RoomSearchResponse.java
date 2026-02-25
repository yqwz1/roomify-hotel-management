package com.roomify.backend.dto;

import java.util.List;

/**
 * Response DTO for the room availability search endpoint.
 *
 * <p>
 * Wraps the list of available rooms with metadata about the total
 * number of results, giving the client a complete picture of the search
 * outcome in a single response.
 * </p>
 */
public class RoomSearchResponse {

    private List<RoomResponse> rooms;
    private int totalResults;

    // Constructors
    public RoomSearchResponse() {
    }

    public RoomSearchResponse(List<RoomResponse> rooms, int totalResults) {
        this.rooms = rooms;
        this.totalResults = totalResults;
    }

    // Getters and Setters
    public List<RoomResponse> getRooms() {
        return rooms;
    }

    public void setRooms(List<RoomResponse> rooms) {
        this.rooms = rooms;
    }

    public int getTotalResults() {
        return totalResults;
    }

    public void setTotalResults(int totalResults) {
        this.totalResults = totalResults;
    }
}
