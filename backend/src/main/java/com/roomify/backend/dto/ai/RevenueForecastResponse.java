package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RevenueForecastResponse(
        LocalDate forecastStart,
        int forecastDays,
        BigDecimal predictedRevenueTotal,
        double predictedAverageOccupancy,
        double confidence,
        List<ForecastPoint> points) {
}
