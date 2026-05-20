package com.roomify.backend.dto.ai;

import java.math.BigDecimal;

public record ElasticitySimulationPointResponse(
        BigDecimal price,
        double occupancy,
        int expectedBookings,
        BigDecimal revenue,
        BigDecimal profit,
        double deltaPercentage,
        boolean recommended) {
}
