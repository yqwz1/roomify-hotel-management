package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.util.List;

public record ElasticityForecastResponse(
        Long roomTypeId,
        String roomType,
        BigDecimal currentPrice,
        BigDecimal optimalPrice,
        double expectedOccupancy,
        int expectedBookings,
        BigDecimal expectedRevenue,
        BigDecimal expectedProfit,
        double confidenceScore,
        int forecastDays,
        String modelType,
        String source,
        boolean fallbackUsed,
        List<ElasticitySimulationPointResponse> priceSimulations) {
}
