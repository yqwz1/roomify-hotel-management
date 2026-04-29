package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AiFinanceDataSummaryResponse(
        long reservations,
        long payments,
        long expenses,
        LocalDate dateRangeStart,
        LocalDate dateRangeEnd,
        BigDecimal totalRevenue,
        double averageOccupancy,
        long roomTypes) {
}
