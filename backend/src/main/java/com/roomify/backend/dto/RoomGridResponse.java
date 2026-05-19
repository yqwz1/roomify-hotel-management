package com.roomify.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class RoomGridResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private List<RoomGridRowDto> rooms = new ArrayList<>();

    public RoomGridResponse() {
    }

    public RoomGridResponse(LocalDate startDate, LocalDate endDate, List<RoomGridRowDto> rooms) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.rooms = rooms != null ? rooms : new ArrayList<>();
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<RoomGridRowDto> getRooms() {
        return rooms;
    }

    public void setRooms(List<RoomGridRowDto> rooms) {
        this.rooms = rooms != null ? rooms : new ArrayList<>();
    }
}
