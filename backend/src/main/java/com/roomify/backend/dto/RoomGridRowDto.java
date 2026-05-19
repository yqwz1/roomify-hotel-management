package com.roomify.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class RoomGridRowDto {

    private Long id;
    private String roomNumber;
    private String roomTypeCode;
    private String roomTypeName;
    private List<RoomGridReservationDto> reservations = new ArrayList<>();

    public RoomGridRowDto() {
    }

    public RoomGridRowDto(
            Long id,
            String roomNumber,
            String roomTypeCode,
            String roomTypeName,
            List<RoomGridReservationDto> reservations) {
        this.id = id;
        this.roomNumber = roomNumber;
        this.roomTypeCode = roomTypeCode;
        this.roomTypeName = roomTypeName;
        this.reservations = reservations != null ? reservations : new ArrayList<>();
    }

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

    public String getRoomTypeCode() {
        return roomTypeCode;
    }

    public void setRoomTypeCode(String roomTypeCode) {
        this.roomTypeCode = roomTypeCode;
    }

    public String getRoomTypeName() {
        return roomTypeName;
    }

    public void setRoomTypeName(String roomTypeName) {
        this.roomTypeName = roomTypeName;
    }

    public List<RoomGridReservationDto> getReservations() {
        return reservations;
    }

    public void setReservations(List<RoomGridReservationDto> reservations) {
        this.reservations = reservations != null ? reservations : new ArrayList<>();
    }
}
