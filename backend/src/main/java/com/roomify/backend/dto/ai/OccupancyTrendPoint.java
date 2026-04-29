package com.roomify.backend.dto.ai;

import java.time.LocalDate;

public record OccupancyTrendPoint(
        LocalDate date,
        double occupancyRate,
        long occupiedRoomNights,
        long totalRoomNights) {
}
