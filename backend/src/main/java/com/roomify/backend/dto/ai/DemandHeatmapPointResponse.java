package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DemandHeatmapPointResponse(
        LocalDate date,
        int demandScore,
        double occupancy,
        BigDecimal revenue,
        long bookings,
        boolean weekend,
        boolean holiday,
        String holidayLabel,
        Long roomTypeId,
        String roomType) {
}
