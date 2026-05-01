package com.roomify.backend.dto.ai;

import java.math.BigDecimal;

public record PricingRecommendationResponse(
        String roomType,
        BigDecimal currentPrice,
        BigDecimal suggestedPrice,
        double adjustmentPercent,
        String riskLevel,
        String reason) {
}
