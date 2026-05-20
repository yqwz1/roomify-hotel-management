package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.roomify.backend.dto.ai.AiAssistantChatMessage;
import com.roomify.backend.dto.ai.AiAssistantChatRequest;
import com.roomify.backend.dto.ai.AiAssistantChatResponse;
import com.roomify.backend.dto.ai.DemandHeatmapPointResponse;
import com.roomify.backend.dto.ai.ElasticityForecastResponse;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);
    private static final String OPENAI_SOURCE = "OPENAI";
    private static final String FALLBACK_SOURCE = "LOCAL_TEMPLATE_FALLBACK";

    private final AiAssistantContextBuilder contextBuilder;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String openAiApiKey;
    private final String openAiModel;
    private final String openAiBaseUrl;

    public AiAssistantService(
            AiAssistantContextBuilder contextBuilder,
            ObjectMapper objectMapper,
            @Value("${roomify.openai.api-key:${OPENAI_API_KEY:}}") String openAiApiKey,
            @Value("${roomify.openai.model:${ROOMIFY_OPENAI_MODEL:gpt-4.1-mini}}") String openAiModel,
            @Value("${roomify.openai.base-url:${ROOMIFY_OPENAI_BASE_URL:https://api.openai.com/v1/responses}}") String openAiBaseUrl,
            @Value("${roomify.openai.timeout-ms:${ROOMIFY_OPENAI_TIMEOUT_MS:12000}}") long timeoutMs) {
        this.contextBuilder = contextBuilder;
        this.objectMapper = objectMapper;
        this.openAiApiKey = openAiApiKey;
        this.openAiModel = openAiModel;
        this.openAiBaseUrl = openAiBaseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(timeoutMs, 1000L)))
                .build();
    }

    public AiAssistantChatResponse chat(AiAssistantChatRequest request) {
        AiAssistantContextBuilder.AiAssistantContext context = contextBuilder.buildContext();
        if (openAiApiKey != null && !openAiApiKey.isBlank()) {
            try {
                String answer = askOpenAi(request, context);
                if (answer != null && !answer.isBlank()) {
                    return new AiAssistantChatResponse(
                            answer.trim(),
                            OPENAI_SOURCE,
                            false,
                            openAiModel,
                            context.summaryText(),
                            context.suggestedPrompts(),
                            LocalDateTime.now());
                }
            } catch (Exception exception) { // noqa: BLE001
                log.warn("Falling back to local AI assistant template: {}", exception.getMessage(), exception);
            }
        }

        return new AiAssistantChatResponse(
                buildFallbackAnswer(request.message(), context),
                FALLBACK_SOURCE,
                true,
                "template-analytics-engine",
                context.summaryText(),
                context.suggestedPrompts(),
                LocalDateTime.now());
    }

    private String askOpenAi(
            AiAssistantChatRequest request,
            AiAssistantContextBuilder.AiAssistantContext context) throws IOException, InterruptedException {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", openAiModel);
        payload.put("temperature", 0.2);
        payload.put("max_output_tokens", 500);

        ArrayNode input = objectMapper.createArrayNode();
        input.add(buildMessage("system", buildSystemPrompt(context)));
        if (request.history() != null) {
            request.history().stream()
                    .filter(message -> message != null && message.content() != null && !message.content().isBlank())
                    .limit(6)
                    .forEach(message -> input.add(buildMessage(normalizeRole(message), message.content())));
        }
        input.add(buildMessage("user", request.message()));
        payload.set("input", input);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(openAiBaseUrl))
                .timeout(Duration.ofSeconds(12))
                .header("Authorization", "Bearer " + openAiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("OpenAI returned HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String outputText = root.path("output_text").asText("");
        if (!outputText.isBlank()) {
            return outputText;
        }
        for (JsonNode output : root.path("output")) {
            for (JsonNode content : output.path("content")) {
                String text = content.path("text").asText("");
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return null;
    }

    private ObjectNode buildMessage(String role, String text) {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", role);
        ArrayNode content = objectMapper.createArrayNode();
        ObjectNode textNode = objectMapper.createObjectNode();
        textNode.put("type", "text");
        textNode.put("text", text);
        content.add(textNode);
        message.set("content", content);
        return message;
    }

    private String buildSystemPrompt(AiAssistantContextBuilder.AiAssistantContext context) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are Roomify's hotel manager AI assistant. ")
                .append("Answer with concise operational guidance grounded only in the provided hotel analytics context. ")
                .append("When numbers are relevant, cite them directly. ")
                .append("If the data is insufficient, say so explicitly.\n\n")
                .append("Current analytics context:\n")
                .append(context.summaryText())
                .append("\n\nElasticity recommendations:\n");
        for (ElasticityForecastResponse forecast : context.elasticityForecasts()) {
            prompt.append("- ")
                    .append(forecast.roomType())
                    .append(": current SAR ")
                    .append(forecast.currentPrice().toPlainString())
                    .append(", optimal SAR ")
                    .append(forecast.optimalPrice().toPlainString())
                    .append(", expected occupancy ")
                    .append(forecast.expectedOccupancy())
                    .append("%, expected revenue SAR ")
                    .append(forecast.expectedRevenue().toPlainString())
                    .append('\n');
        }
        prompt.append("\nPeak demand dates this month:\n");
        context.demandHeatmap().stream()
                .sorted((left, right) -> Integer.compare(right.demandScore(), left.demandScore()))
                .limit(5)
                .forEach(point -> prompt.append("- ")
                        .append(point.date())
                        .append(": score ")
                        .append(point.demandScore())
                        .append(", occupancy ")
                        .append(point.occupancy())
                        .append("%, revenue SAR ")
                        .append(point.revenue().toPlainString())
                        .append('\n'));
        return prompt.toString();
    }

    private String buildFallbackAnswer(
            String message,
            AiAssistantContextBuilder.AiAssistantContext context) {
        String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);
        if (normalized.contains("revenue") && normalized.contains("drop")) {
            return "Weekly revenue is SAR "
                    + money(context.summary().thisWeekRevenue())
                    + ", versus SAR "
                    + money(context.summary().lastWeekRevenue())
                    + " last week, a change of "
                    + round(context.summary().revenueChangePercentage())
                    + "%. The main operational drag in the current context is "
                    + context.cancellationInsight().reason()
                    + ", with "
                    + context.cancellationInsight().count()
                    + " cancellations recorded.";
        }
        if (normalized.contains("best room") || normalized.contains("performs best")) {
            RoomTypeRevenueResponse bestRoomType = context.bestRoomType();
            if (bestRoomType == null) {
                return "Room-type performance data is not available yet.";
            }
            return bestRoomType.roomType()
                    + " performs best right now with SAR "
                    + money(bestRoomType.revenue())
                    + " in revenue across "
                    + bestRoomType.reservations()
                    + " reservations.";
        }
        if (normalized.contains("next weekend") || normalized.contains("price should")) {
            List<ElasticityForecastResponse> topRecommendations = context.elasticityForecasts().stream()
                    .sorted((left, right) -> right.expectedProfit().compareTo(left.expectedProfit()))
                    .limit(3)
                    .toList();
            StringBuilder builder = new StringBuilder("For next-weekend pricing, the strongest current recommendations are: ");
            for (int index = 0; index < topRecommendations.size(); index++) {
                ElasticityForecastResponse forecast = topRecommendations.get(index);
                if (index > 0) {
                    builder.append(" ");
                }
                builder.append(forecast.roomType())
                        .append(" at SAR ")
                        .append(money(forecast.optimalPrice()))
                        .append(" with expected profit SAR ")
                        .append(money(forecast.expectedProfit()))
                        .append(".");
            }
            return builder.toString();
        }
        if (normalized.contains("highest occupancy") || normalized.contains("which month")) {
            return context.bestOccupancyMonth().monthName()
                    + " has the highest average occupancy in the current dataset at "
                    + context.bestOccupancyMonth().averageOccupancy()
                    + "%.";
        }
        if (normalized.contains("cancellation")) {
            return "The leading cancellation driver in the current data is "
                    + context.cancellationInsight().reason()
                    + ", accounting for "
                    + context.cancellationInsight().count()
                    + " of "
                    + context.cancellationInsight().totalCancelled()
                    + " cancelled reservations.";
        }
        if (normalized.contains("predict") && normalized.contains("next month")) {
            return "Projected next-month revenue is SAR "
                    + money(context.projectedNextMonthRevenue())
                    + ", based on the trailing 30-day revenue run rate adjusted for next month's seasonality.";
        }

        DemandHeatmapPointResponse peakDemandDay = context.peakDemandDay();
        return context.summaryText()
                + (peakDemandDay == null
                        ? ""
                        : " Peak demand this month is currently centered on "
                                + peakDemandDay.date()
                                + " with demand score "
                                + peakDemandDay.demandScore()
                                + ".");
    }

    private String normalizeRole(AiAssistantChatMessage message) {
        String role = message.role();
        if (role == null) {
            return "user";
        }
        return switch (role.toLowerCase(Locale.ROOT)) {
            case "assistant", "system" -> role.toLowerCase(Locale.ROOT);
            default -> "user";
        };
    }

    private String money(BigDecimal value) {
        return value == null ? "0.00" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
