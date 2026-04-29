package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ForecastPoint(
        LocalDate date,
        BigDecimal predictedRevenue,
        double predictedOccupancy) {
}
