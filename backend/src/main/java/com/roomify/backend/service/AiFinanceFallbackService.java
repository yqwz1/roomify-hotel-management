package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class AiFinanceFallbackService {

    public static final String FALLBACK_SOURCE = "SAFE_DEMO_FALLBACK";

    private static final Logger log = LoggerFactory.getLogger(AiFinanceFallbackService.class);
    private static final String FALLBACK_RESOURCE = "demo/ai-finance-fallback.json";

    private final ObjectMapper objectMapper;
    private final boolean fallbackEnabled;

    public AiFinanceFallbackService(
            ObjectMapper objectMapper,
            @Value("${roomify.ai-service.fallback-enabled:true}") boolean fallbackEnabled) {
        this.objectMapper = objectMapper;
        this.fallbackEnabled = fallbackEnabled;
    }

    public boolean isFallbackEnabled() {
        return fallbackEnabled;
    }

    public String getFallbackSource() {
        return FALLBACK_SOURCE;
    }

    public ObjectNode getForecastFallback(String reason) {
        logFallbackUsage(reason);
        return buildRollingFallback("AI service is unavailable. Showing a safe Roomify Riyadh forecast.");
    }

    public ObjectNode getPricingFallback(String reason) {
        logFallbackUsage(reason);
        ObjectNode root = buildRollingFallback("AI service is unavailable. Showing safe Roomify Riyadh price recommendations.");
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("source", root.path("source").asText(FALLBACK_SOURCE));
        payload.put("warning", root.path("warning").asText("AI service is unavailable. Showing a safe demo fallback forecast."));
        payload.set("pricingRecommendations", root.path("pricingRecommendations").deepCopy());
        return payload;
    }

    public ObjectNode getMinimalForecastFallback(String warning) {
        return buildRollingFallback(warning);
    }

    private ObjectNode buildRollingFallback(String warning) {
        ObjectNode root = objectMapper.createObjectNode();
        LocalDate start = LocalDate.now();
        root.put("source", FALLBACK_SOURCE);
        root.put("warning", warning);
        root.put("forecastStart", start.toString());
        root.put("forecastDays", 30);

        ArrayNode points = objectMapper.createArrayNode();
        BigDecimal revenueTotal = BigDecimal.ZERO;
        double occupancyTotal = 0.0;
        for (int day = 0; day < 30; day++) {
            LocalDate date = start.plusDays(day);
            double demand = demandFactor(date);
            double occupancy = Math.max(48.0, Math.min(92.0, 70.0 + ((demand - 1.0) * 80.0) + ((day % 5) - 2)));
            BigDecimal revenue = roundMoney(BigDecimal.valueOf(8200 * demand + (day % 4) * 350));
            revenueTotal = revenueTotal.add(revenue);
            occupancyTotal += occupancy;
            points.add(createPoint(date.toString(), revenue.toPlainString(), Math.round(occupancy * 10.0) / 10.0));
        }
        root.set("points", points);
        root.put("predictedRevenueTotal", roundMoney(revenueTotal));
        root.put("predictedAverageOccupancy", Math.round((occupancyTotal / 30.0) * 10.0) / 10.0);
        root.put("confidence", 0.68);

        ArrayNode pricingRecommendations = objectMapper.createArrayNode();
        pricingRecommendations.add(createRecommendation("Classic King", "430.00", "450.00", 4.7, "LOW",
                "Weekday business demand is healthy; keep a modest rounded SAR uplift."));
        pricingRecommendations.add(createRecommendation("Deluxe Twin", "650.00", "700.00", 7.7, "LOW",
                "Weekend and GCC family demand support a rounded SAR increase."));
        pricingRecommendations.add(createRecommendation("Family Room", "780.00", "800.00", 2.6, "MEDIUM",
                "Family demand is steady; keep pricing close to current level."));
        pricingRecommendations.add(createRecommendation("Executive Suite", "980.00", "1050.00", 7.1, "MEDIUM",
                "Corporate stays are expected to strengthen over the next two weeks."));
        pricingRecommendations.add(createRecommendation("Olaya Suite", "1400.00", "1450.00", 3.6, "MEDIUM",
                "Premium demand is strong but price sensitivity is higher for long stays."));
        root.set("pricingRecommendations", pricingRecommendations);
        return root;
    }

    private double demandFactor(LocalDate date) {
        double factor = 1.0;
        int day = date.getDayOfWeek().getValue();
        if (day == 5 || day == 6) {
            factor += 0.14;
        } else if (day == 4) {
            factor += 0.06;
        } else if (day == 1 || day == 2) {
            factor -= 0.05;
        }
        int month = date.getMonthValue();
        if (month == 6 || month == 7 || month == 8) {
            factor += 0.05;
        }
        if (month == 9 && date.getDayOfMonth() >= 20 && date.getDayOfMonth() <= 25) {
            factor += 0.16;
        }
        return Math.max(0.84, Math.min(1.28, factor));
    }

    private BigDecimal roundMoney(BigDecimal value) {
        return value.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void logFallbackUsage(String reason) {
        log.warn("Using AI finance safe demo fallback because: {}", reason);
    }

    private ObjectNode loadFallbackRoot() {
        ClassPathResource resource = new ClassPathResource(FALLBACK_RESOURCE);
        if (!resource.exists()) {
            log.warn("AI finance fallback resource {} is missing. Returning minimal safe fallback.", FALLBACK_RESOURCE);
            return getMinimalForecastFallback(
                    "AI service is unavailable. Showing a safe demo fallback forecast.");
        }

        try (InputStream inputStream = resource.getInputStream()) {
            JsonNode node = objectMapper.readTree(inputStream);
            if (node instanceof ObjectNode objectNode) {
                return objectNode.deepCopy();
            }
            log.warn("AI finance fallback resource {} is not a JSON object. Returning minimal safe fallback.",
                    FALLBACK_RESOURCE);
            return getMinimalForecastFallback(
                    "AI service is unavailable. Showing a safe demo fallback forecast.");
        } catch (IOException exception) {
            log.warn("Failed to load AI finance fallback resource {}. Returning minimal safe fallback.",
                    FALLBACK_RESOURCE, exception);
            return getMinimalForecastFallback(
                    "AI service is unavailable. Showing a safe demo fallback forecast.");
        }
    }

    private ObjectNode createPoint(String date, String revenue, double occupancy) {
        ObjectNode point = objectMapper.createObjectNode();
        point.put("date", date);
        point.put("predictedRevenue", new BigDecimal(revenue));
        point.put("predictedOccupancy", occupancy);
        return point;
    }

    private ObjectNode createRecommendation(
            String roomType,
            String currentPrice,
            String suggestedPrice,
            double adjustmentPercent,
            String riskLevel,
            String reason) {
        ObjectNode recommendation = objectMapper.createObjectNode();
        recommendation.put("roomType", roomType);
        recommendation.put("currentPrice", new BigDecimal(currentPrice));
        recommendation.put("suggestedPrice", new BigDecimal(suggestedPrice));
        recommendation.put("adjustmentPercent", adjustmentPercent);
        recommendation.put("riskLevel", riskLevel);
        recommendation.put("reason", reason);
        return recommendation;
    }
}
