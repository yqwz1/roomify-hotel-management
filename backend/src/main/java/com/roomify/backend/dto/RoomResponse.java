package com.roomify.backend.dto;

import com.roomify.backend.entity.RoomStatus;

/**
 * Response DTO for Room entity.
 */
public class RoomResponse {

    private Long id;
    private String roomNumber;
    private RoomTypeResponse roomType;
    private Integer floor;
    private RoomStatus status;

    // Constructors
    public RoomResponse() {}

    public RoomResponse(Long id, String roomNumber, RoomTypeResponse roomType, Integer floor, RoomStatus status) {
        this.id = id;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.floor = floor;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public RoomTypeResponse getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomTypeResponse roomType) {
        this.roomType = roomType;
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
