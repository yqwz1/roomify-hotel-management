package com.roomify.backend.dto;

import com.roomify.backend.entity.RoomStatus;
import jakarta.validation.constraints.*;

/**
 * Request DTO for creating or updating a Room.
 */
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    @Size(min = 1, max = 50, message = "Room number must be between 1 and 50 characters")
    private String roomNumber;

    @NotNull(message = "Room type ID is required")
    private Long roomTypeId;

    @Min(value = 1, message = "Floor must be at least 1")
    private Integer floor;

    @NotNull(message = "Room status is required")
    private RoomStatus status;

    // Constructors
    public RoomRequest() {}

    public RoomRequest(String roomNumber, Long roomTypeId, Integer floor, RoomStatus status) {
        this.roomNumber = roomNumber;
        this.roomTypeId = roomTypeId;
        this.floor = floor;
        this.status = status;
    }

    // Getters and Setters
    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public void setRoomTypeId(Long roomTypeId) {
        this.roomTypeId = roomTypeId;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }
}
