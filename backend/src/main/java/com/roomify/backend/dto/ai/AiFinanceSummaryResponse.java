package com.roomify.backend.dto.ai;

import java.math.BigDecimal;

public record AiFinanceSummaryResponse(
        BigDecimal thisWeekRevenue,
        BigDecimal lastWeekRevenue,
        double revenueChangePercentage,
        double currentOccupancy,
        String topRoomType,
        BigDecimal totalExpenses,
        BigDecimal netProfit) {
}
