package com.roomify.backend.dto.ai;

import java.math.BigDecimal;

public record RoomTypeRevenueResponse(
        String roomType,
        BigDecimal revenue,
        long reservations,
        BigDecimal averagePrice) {
}
