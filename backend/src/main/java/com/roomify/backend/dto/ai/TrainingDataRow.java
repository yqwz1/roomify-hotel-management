package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TrainingDataRow(
        LocalDate date,
        int dayOfWeek,
        int month,
        boolean weekend,
        String roomType,
        Long roomTypeId,
        long totalRooms,
        long occupiedRoomNights,
        long confirmedBookings,
        long cancelledBookings,
        BigDecimal averageRoomPrice,
        BigDecimal dailyRevenue,
        BigDecimal dailyExpenses,
        double occupancyRate) {
}
