package com.roomify.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.roomify.backend.dto.ai.AiFinanceDataSummaryResponse;
import com.roomify.backend.dto.ai.AiFinanceSummaryResponse;
import com.roomify.backend.dto.ai.AskAiFinanceRequest;
import com.roomify.backend.dto.ai.AskAiFinanceResponse;
import com.roomify.backend.dto.ai.DemandHeatmapPointResponse;
import com.roomify.backend.dto.ai.OccupancyTrendPoint;
import com.roomify.backend.dto.ai.PricingRecommendationResponse;
import com.roomify.backend.dto.ai.RevenueTrendPoint;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.service.AiFinanceClient;
import com.roomify.backend.service.AiFinanceFallbackService;
import com.roomify.backend.service.DemandHeatmapService;
import com.roomify.backend.service.FinanceAnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/ai-finance")
@PreAuthorize("hasRole('MANAGER')")
public class AiFinanceController {

    private static final String FASTAPI_MODEL_SOURCE = "FASTAPI_MODEL";
    private static final Set<String> SUPPORTED_INTENTS = Set.of(
            "REVENUE_FORECAST",
            "PRICING_RECOMMENDATION",
            "OCCUPANCY_ANALYSIS",
            "ROOM_TYPE_PERFORMANCE");

    private final FinanceAnalyticsService financeAnalyticsService;
    private final AiFinanceClient aiFinanceClient;
    private final AiFinanceFallbackService aiFinanceFallbackService;
    private final DemandHeatmapService demandHeatmapService;
    private final ObjectMapper objectMapper;

    public AiFinanceController(
            FinanceAnalyticsService financeAnalyticsService,
            AiFinanceClient aiFinanceClient,
            AiFinanceFallbackService aiFinanceFallbackService,
            DemandHeatmapService demandHeatmapService,
            ObjectMapper objectMapper) {
        this.financeAnalyticsService = financeAnalyticsService;
        this.aiFinanceClient = aiFinanceClient;
        this.aiFinanceFallbackService = aiFinanceFallbackService;
        this.demandHeatmapService = demandHeatmapService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/data-summary")
    public ResponseEntity<AiFinanceDataSummaryResponse> getDataSummary() {
        return ResponseEntity.ok(financeAnalyticsService.getDataSummary());
    }

    @GetMapping("/summary")
    public ResponseEntity<AiFinanceSummaryResponse> getSummary() {
        return ResponseEntity.ok(financeAnalyticsService.getFinanceSummary());
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<RevenueTrendPoint>> getRevenueTrend(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(financeAnalyticsService.getRevenueTrend(start, end));
    }

    @GetMapping("/occupancy-trend")
    public ResponseEntity<List<OccupancyTrendPoint>> getOccupancyTrend(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(financeAnalyticsService.getOccupancyTrend(start, end));
    }

    @GetMapping("/room-type-revenue")
    public ResponseEntity<List<RoomTypeRevenueResponse>> getRoomTypeRevenue() {
        return ResponseEntity.ok(financeAnalyticsService.getRoomTypeRevenue());
    }

    @GetMapping("/demand-heatmap")
    public ResponseEntity<List<DemandHeatmapPointResponse>> getDemandHeatmap(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long roomTypeId) {
        return ResponseEntity.ok(demandHeatmapService.getDemandHeatmap(month, roomTypeId));
    }

    @GetMapping("/training-data")
    public ResponseEntity<List<TrainingDataRow>> getTrainingData(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(financeAnalyticsService.getTrainingData(start, end));
    }

    @GetMapping("/health")
    public ResponseEntity<Object> getAiHealth() {
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.getHealth();
        if (result.success()) {
            return ResponseEntity.ok(toResponseBody(result.body()));
        }

        ObjectNode response = objectMapper.createObjectNode();
        response.put("status", "DOWN");
        response.put("service", "ai-finance-service");
        response.put("fallbackAvailable", aiFinanceFallbackService.isFallbackEnabled());
        return ResponseEntity.ok(toResponseBody(response));
    }

    @GetMapping("/model-info")
    public ResponseEntity<Object> getModelInfo() {
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.getModelInfo();
        if (result.success()) {
            return ResponseEntity.ok(toResponseBody(result.body()));
        }

        ObjectNode response = objectMapper.createObjectNode();
        response.put("trained", false);
        response.put("status", "AI_SERVICE_UNAVAILABLE");
        response.put("message", "AI service is unavailable. Model information cannot be loaded.");
        return ResponseEntity.ok(toResponseBody(response));
    }

    @GetMapping("/revenue-forecast")
    public ResponseEntity<Object> getRevenueForecast() {
        ResolvedAiPayload payload = resolveForecastPayload();
        return ResponseEntity.status(payload.status()).body(toResponseBody(payload.body()));
    }

    @GetMapping("/pricing-recommendations")
    public ResponseEntity<Object> getPricingRecommendations() {
        ResolvedAiPayload payload = resolvePricingPayload();
        return ResponseEntity.status(payload.status()).body(toResponseBody(payload.body()));
    }

    @PostMapping("/ask")
    public ResponseEntity<?> askAiFinance(@RequestBody(required = false) AskAiFinanceRequest request) {
        String requestedIntent = request == null || request.intent() == null
                ? ""
                : request.intent().trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_INTENTS.contains(requestedIntent)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Unsupported intent.",
                    "supportedIntents", SUPPORTED_INTENTS));
        }

        return switch (requestedIntent) {
            case "REVENUE_FORECAST" -> buildRevenueForecastAnswer(requestedIntent);
            case "PRICING_RECOMMENDATION" -> buildPricingRecommendationAnswer(requestedIntent);
            case "OCCUPANCY_ANALYSIS" -> buildOccupancyAnalysisAnswer(requestedIntent);
            case "ROOM_TYPE_PERFORMANCE" -> ResponseEntity.ok(buildRoomTypePerformanceAnswer(requestedIntent));
            default -> ResponseEntity.badRequest().body(Map.of(
                    "error", "Unsupported intent.",
                    "supportedIntents", SUPPORTED_INTENTS));
        };
    }

    @GetMapping(value = "/training-data.csv", produces = "text/csv")
    public ResponseEntity<String> getTrainingDataCsv(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end) {
        List<TrainingDataRow> rows = financeAnalyticsService.getTrainingData(start, end);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=training-data.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(toCsv(rows));
    }

    private String toCsv(List<TrainingDataRow> rows) {
        StringBuilder csv = new StringBuilder();
        csv.append("date,dayOfWeek,month,weekend,roomType,roomTypeId,totalRooms,occupiedRoomNights,confirmedBookings,")
                .append("cancelledBookings,averageRoomPrice,dailyRevenue,dailyExpenses,occupancyRate\n");
        for (TrainingDataRow row : rows) {
            csv.append(row.date()).append(',')
                    .append(row.dayOfWeek()).append(',')
                    .append(row.month()).append(',')
                    .append(row.weekend()).append(',')
                    .append(escapeCsv(row.roomType())).append(',')
                    .append(row.roomTypeId()).append(',')
                    .append(row.totalRooms()).append(',')
                    .append(row.occupiedRoomNights()).append(',')
                    .append(row.confirmedBookings()).append(',')
                    .append(row.cancelledBookings()).append(',')
                    .append(row.averageRoomPrice()).append(',')
                    .append(row.dailyRevenue()).append(',')
                    .append(row.dailyExpenses()).append(',')
                    .append(row.occupancyRate())
                    .append('\n');
        }
        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private ResponseEntity<?> buildRevenueForecastAnswer(String intent) {
        ResolvedAiPayload payload = resolveForecastPayload();
        if (!payload.available()) {
            return ResponseEntity.status(payload.status()).body(toResponseBody(payload.body()));
        }

        BigDecimal predictedRevenueTotal = decimalValue(payload.body(), "predictedRevenueTotal");
        double predictedAverageOccupancy = doubleValue(payload.body(), "predictedAverageOccupancy");
        int forecastDays = payload.body().path("forecastDays").asInt(30);
        String answer = payload.isFallback()
                ? "The safe demo fallback projects " + formatMoney(predictedRevenueTotal)
                + " in revenue over the next " + forecastDays
                + " days with average occupancy of " + formatPercent(predictedAverageOccupancy) + "."
                : "The model predicts " + formatMoney(predictedRevenueTotal)
                + " in revenue over the next " + forecastDays
                + " days with average occupancy of " + formatPercent(predictedAverageOccupancy) + ".";

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("predictedRevenueTotal", predictedRevenueTotal);
        metrics.put("predictedAverageOccupancy", predictedAverageOccupancy);
        metrics.put("forecastDays", forecastDays);
        return ResponseEntity.ok(new AskAiFinanceResponse(intent, answer, metrics, payload.source()));
    }

    private ResponseEntity<?> buildPricingRecommendationAnswer(String intent) {
        ResolvedAiPayload payload = resolvePricingPayload();
        if (!payload.available()) {
            return ResponseEntity.status(payload.status()).body(toResponseBody(payload.body()));
        }

        ArrayNode recommendations = arrayValue(payload.body(), "pricingRecommendations");
        if (recommendations.isEmpty()) {
            return ResponseEntity.ok(new AskAiFinanceResponse(
                    intent,
                    "No pricing recommendations are currently available.",
                    Map.of("recommendationCount", 0),
                    payload.source()));
        }

        JsonNode strongestRecommendation = recommendations.get(0);
        double maxAdjustment = strongestRecommendation.path("adjustmentPercent").asDouble(0.0);
        for (JsonNode recommendation : recommendations) {
            double adjustment = recommendation.path("adjustmentPercent").asDouble(0.0);
            if (adjustment > maxAdjustment) {
                maxAdjustment = adjustment;
                strongestRecommendation = recommendation;
            }
        }

        String roomType = strongestRecommendation.path("roomType").asText("Unknown");
        String answer = payload.isFallback()
                ? "The safe demo fallback provides pricing guidance for " + recommendations.size()
                + " room types. The largest bounded adjustment is " + roomType
                + " at " + formatPercent(maxAdjustment) + "."
                : "Pricing recommendations are available for " + recommendations.size()
                + " room types. The largest suggested adjustment is " + roomType
                + " at " + formatPercent(maxAdjustment) + ".";

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("recommendationCount", recommendations.size());
        metrics.put("highestAdjustmentRoomType", roomType);
        metrics.put("highestAdjustmentPercent", maxAdjustment);
        return ResponseEntity.ok(new AskAiFinanceResponse(intent, answer, metrics, payload.source()));
    }

    private ResponseEntity<?> buildOccupancyAnalysisAnswer(String intent) {
        ResolvedAiPayload payload = resolveForecastPayload();
        if (!payload.available()) {
            return ResponseEntity.status(payload.status()).body(toResponseBody(payload.body()));
        }

        double predictedAverageOccupancy = doubleValue(payload.body(), "predictedAverageOccupancy");
        double confidence = doubleValue(payload.body(), "confidence");
        int forecastDays = payload.body().path("forecastDays").asInt(30);

        String answer = payload.isFallback()
                ? "The safe demo fallback indicates average occupancy of " + formatPercent(predictedAverageOccupancy)
                + " over the next " + forecastDays + " days with confidence " + formatConfidence(confidence) + "."
                : "The model indicates average occupancy of " + formatPercent(predictedAverageOccupancy)
                + " over the next " + forecastDays + " days with confidence " + formatConfidence(confidence) + ".";

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("predictedAverageOccupancy", predictedAverageOccupancy);
        metrics.put("confidence", confidence);
        metrics.put("forecastDays", forecastDays);
        return ResponseEntity.ok(new AskAiFinanceResponse(intent, answer, metrics, payload.source()));
    }

    private AskAiFinanceResponse buildRoomTypePerformanceAnswer(String intent) {
        List<RoomTypeRevenueResponse> roomTypeRevenue = financeAnalyticsService.getRoomTypeRevenue();
        if (roomTypeRevenue.isEmpty()) {
            return new AskAiFinanceResponse(
                    intent,
                    "No room type performance data is currently available.",
                    Map.of("roomTypeCount", 0),
                    "SPRING_ANALYTICS");
        }

        RoomTypeRevenueResponse topPerformer = roomTypeRevenue.stream()
                .max((left, right) -> left.revenue().compareTo(right.revenue()))
                .orElse(roomTypeRevenue.getFirst());

        String answer = "The top room type by revenue is " + topPerformer.roomType()
                + " at " + formatMoney(topPerformer.revenue())
                + " across " + topPerformer.reservations() + " reservations.";

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("topRoomType", topPerformer.roomType());
        metrics.put("topRevenue", topPerformer.revenue());
        metrics.put("topReservations", topPerformer.reservations());
        metrics.put("roomTypeCount", roomTypeRevenue.size());
        return new AskAiFinanceResponse(intent, answer, metrics, "SPRING_ANALYTICS");
    }

    private ResolvedAiPayload resolveForecastPayload() {
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.getRevenueForecast();
        if (result.success()) {
            ObjectNode body = ensureObjectNode(result.body());
            body.put("source", FASTAPI_MODEL_SOURCE);
            return new ResolvedAiPayload(body, FASTAPI_MODEL_SOURCE, HttpStatus.OK, true, false);
        }
        if (aiFinanceFallbackService.isFallbackEnabled()) {
            return new ResolvedAiPayload(
                    aiFinanceFallbackService.getForecastFallback(result.errorMessage()),
                    aiFinanceFallbackService.getFallbackSource(),
                    HttpStatus.OK,
                    true,
                    true);
        }
        return unavailablePayload("AI service is unavailable and fallback is disabled.");
    }

    private ResolvedAiPayload resolvePricingPayload() {
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.getPricingRecommendations();
        if (result.success()) {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("source", FASTAPI_MODEL_SOURCE);
            payload.set("pricingRecommendations", result.body().deepCopy());
            return new ResolvedAiPayload(payload, FASTAPI_MODEL_SOURCE, HttpStatus.OK, true, false);
        }
        if (aiFinanceFallbackService.isFallbackEnabled()) {
            return new ResolvedAiPayload(
                    aiFinanceFallbackService.getPricingFallback(result.errorMessage()),
                    aiFinanceFallbackService.getFallbackSource(),
                    HttpStatus.OK,
                    true,
                    true);
        }
        return unavailablePayload("AI service is unavailable and fallback is disabled.");
    }

    private ResolvedAiPayload unavailablePayload(String message) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("status", "AI_SERVICE_UNAVAILABLE");
        payload.put("message", message);
        payload.put("fallbackEnabled", false);
        return new ResolvedAiPayload(payload, "AI_SERVICE_UNAVAILABLE", HttpStatus.SERVICE_UNAVAILABLE, false, false);
    }

    private ObjectNode ensureObjectNode(JsonNode body) {
        if (body instanceof ObjectNode objectNode) {
            return objectNode.deepCopy();
        }
        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("data", body == null ? objectMapper.nullNode() : body.deepCopy());
        return payload;
    }

    private ArrayNode arrayValue(JsonNode payload, String fieldName) {
        JsonNode node = payload.path(fieldName);
        if (node instanceof ArrayNode arrayNode) {
            return arrayNode;
        }
        return objectMapper.createArrayNode();
    }

    private BigDecimal decimalValue(JsonNode payload, String fieldName) {
        JsonNode node = payload.path(fieldName);
        if (node.isMissingNode() || node.isNull()) {
            return BigDecimal.ZERO;
        }
        return node.decimalValue();
    }

    private double doubleValue(JsonNode payload, String fieldName) {
        return payload.path(fieldName).asDouble(0.0);
    }

    private String formatMoney(BigDecimal value) {
        return "SAR " + value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatPercent(double value) {
        return String.format(Locale.US, "%.2f%%", value);
    }

    private String formatConfidence(double value) {
        return String.format(Locale.US, "%.2f", value);
    }

    private Object toResponseBody(JsonNode body) {
        return objectMapper.convertValue(body, Object.class);
    }

    private record ResolvedAiPayload(
            JsonNode body,
            String source,
            HttpStatus status,
            boolean available,
            boolean isFallback) {
    }
}
