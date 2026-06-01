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
        return loadFallbackRoot();
    }

    public ObjectNode getPricingFallback(String reason) {
        logFallbackUsage(reason);
        ObjectNode root = loadFallbackRoot();
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("source", root.path("source").asText(FALLBACK_SOURCE));
        payload.put("warning", root.path("warning").asText("AI service is unavailable. Showing a safe demo fallback forecast."));
        payload.set("pricingRecommendations", root.path("pricingRecommendations").deepCopy());
        return payload;
    }

    public ObjectNode getMinimalForecastFallback(String warning) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("source", FALLBACK_SOURCE);
        root.put("warning", warning);
        root.put("forecastStart", LocalDate.of(2026, 4, 28).toString());
        root.put("forecastDays", 30);
        root.put("predictedRevenueTotal", new BigDecimal("87500.00"));
        root.put("predictedAverageOccupancy", 75.0);
        root.put("confidence", 0.65);

        ArrayNode points = objectMapper.createArrayNode();
        points.add(createPoint("2026-04-28", "2900.00", 72.5));
        points.add(createPoint("2026-04-29", "2950.00", 73.0));
        root.set("points", points);

        ArrayNode pricingRecommendations = objectMapper.createArrayNode();
        pricingRecommendations.add(createRecommendation("Standard", "220.00", "235.00", 6.8, "LOW",
                "Safe fallback recommendation based on expected moderate occupancy."));
        pricingRecommendations.add(createRecommendation("Deluxe", "350.00", "380.00", 8.6, "LOW",
                "Safe fallback recommendation based on expected demand."));
        pricingRecommendations.add(createRecommendation("Family", "430.00", "455.00", 5.8, "LOW",
                "Safe fallback recommendation with bounded price increase."));
        pricingRecommendations.add(createRecommendation("Executive", "540.00", "565.00", 4.6, "MEDIUM",
                "Safe fallback recommendation with conservative adjustment."));
        pricingRecommendations.add(createRecommendation("Suite", "760.00", "790.00", 3.9, "MEDIUM",
                "Safe fallback recommendation with bounded premium-room adjustment."));
        root.set("pricingRecommendations", pricingRecommendations);
        return root;
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
