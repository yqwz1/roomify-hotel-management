package com.roomify.backend.dto.ai;

import java.math.BigDecimal;

public record ElasticityRoomContextRequest(
        Long roomTypeId,
        String roomType,
        BigDecimal currentPrice,
        long totalRooms,
        double currentOccupancy,
        long currentBookings,
        long cancellations,
        BigDecimal averageDailyExpenses) {
}
