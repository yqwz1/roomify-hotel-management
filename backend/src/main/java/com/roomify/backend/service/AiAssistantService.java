package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import java.net.http.HttpTimeoutException;
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
    private static final String GEMINI_SOURCE = "GEMINI";
    private static final String FALLBACK_SOURCE = "LOCAL_TEMPLATE_FALLBACK";

    private final AiAssistantContextBuilder contextBuilder;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String geminiApiKey;
    private final String geminiModel;
    private final String geminiBaseUrl;
    private final Duration requestTimeout;

    public AiAssistantService(
            AiAssistantContextBuilder contextBuilder,
            ObjectMapper objectMapper,
            @Value("${roomify.gemini.api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${roomify.gemini.model:${ROOMIFY_GEMINI_MODEL:gemini-2.5-flash}}") String geminiModel,
            @Value("${roomify.gemini.base-url:${ROOMIFY_GEMINI_BASE_URL:https://generativelanguage.googleapis.com/v1beta/openai/chat/completions}}") String geminiBaseUrl,
            @Value("${roomify.gemini.timeout-ms:${ROOMIFY_GEMINI_TIMEOUT_MS:12000}}") long timeoutMs) {
        this.contextBuilder = contextBuilder;
        this.objectMapper = objectMapper;
        this.geminiApiKey = geminiApiKey;
        this.geminiModel = geminiModel;
        this.geminiBaseUrl = geminiBaseUrl;
        this.requestTimeout = Duration.ofMillis(Math.max(timeoutMs, 1000L));
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(requestTimeout)
                .build();
    }

    public AiAssistantChatResponse chat(AiAssistantChatRequest request) {
        AiAssistantContextBuilder.AiAssistantContext context = contextBuilder.buildContext();
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("Using local manager assistant fallback: Missing Gemini API key");
            return fallbackResponse(request.message(), context);
        }

        try {
            String answer = askGemini(request, context);
            if (answer != null && !answer.isBlank()) {
                return new AiAssistantChatResponse(
                        answer.trim(),
                        GEMINI_SOURCE,
                        false,
                        geminiModel,
                        context.summaryText(),
                        context.suggestedPrompts(),
                        LocalDateTime.now());
            }
            log.warn("Using local manager assistant fallback: Empty Gemini response");
        } catch (HttpTimeoutException exception) {
            log.warn("Using local manager assistant fallback: Gemini timeout", exception);
        } catch (IOException exception) {
            log.warn(
                    "Using local manager assistant fallback: {}",
                    classifyGeminiIoFailure(exception.getMessage()),
                    exception);
        } catch (Exception exception) { // noqa: BLE001
            log.warn(
                    "Using local manager assistant fallback: Gemini exception - {}",
                    sanitizeProviderError(exception.getMessage()),
                    exception);
        }

        return fallbackResponse(request.message(), context);
    }

    private AiAssistantChatResponse fallbackResponse(
            String message,
            AiAssistantContextBuilder.AiAssistantContext context) {
        return new AiAssistantChatResponse(
                buildFallbackAnswer(message, context),
                FALLBACK_SOURCE,
                true,
                "template-analytics-engine",
                context.summaryText(),
                context.suggestedPrompts(),
                LocalDateTime.now());
    }

    private String askGemini(
            AiAssistantChatRequest request,
            AiAssistantContextBuilder.AiAssistantContext context) throws IOException, InterruptedException {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", geminiModel);
        payload.put("temperature", 0.2);
        payload.put("max_tokens", 500);

        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(buildChatMessage("system", buildSystemPrompt()));
        String userContent = buildGeminiUserContent(request.message(), context);
        log.debug("Gemini user content preview: {}", preview(userContent));
        messages.add(buildChatMessage("user", userContent));
        payload.set("messages", messages);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(geminiBaseUrl))
                .timeout(requestTimeout)
                .header("Authorization", "Bearer " + geminiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Gemini returned HTTP " + response.statusCode() + ": " + truncate(response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        String answer = root.path("choices")
                .path(0)
                .path("message")
                .path("content")
                .asText(null);
        if (answer == null) {
            throw new IOException("Gemini response parsing failed: choices[0].message.content missing");
        }
        return answer;
    }

    private ObjectNode buildChatMessage(String role, String text) {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", role);
        message.put("content", text == null ? "" : text);
        return message;
    }

    private String buildSystemPrompt() {
        return """
                You are Roomify's manager AI assistant. Your main role is to help hotel managers with revenue, occupancy, cancellations, demand spikes, pricing recommendations, reservations, rooms, guests, services, and finance insights.

                You have access to live Roomify analytics context. Use it whenever the user asks about hotel operations, revenue, occupancy, cancellations, demand, pricing, reservations, rooms, guests, services, or finance.

                You may also answer greetings, basic calculations, and short general questions naturally.

                If the user asks something unrelated to hotel management and it is not a simple greeting, simple calculation, or short general question, politely redirect them back to Roomify hotel analytics.

                Be concise, practical, professional, and helpful.
                """;
    }

    private String buildGeminiUserContent(
            String message,
            AiAssistantContextBuilder.AiAssistantContext context) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Live Roomify analytics context:\n")
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
        prompt.append("\nUser message:\n")
                .append(message == null ? "" : message.trim());
        return prompt.toString();
    }

    private String sanitizeProviderError(String message) {
        if (message == null || message.isBlank()) {
            return "Unknown Gemini provider error";
        }
        return message.replace(geminiApiKey, "[REDACTED]");
    }

    private String classifyGeminiIoFailure(String message) {
        String sanitized = sanitizeProviderError(message);
        String normalized = sanitized.toLowerCase(Locale.ROOT);
        if (normalized.contains("gemini returned http")) {
            return "Gemini HTTP error - " + sanitized;
        }
        if (normalized.contains("parsing failed") || normalized.contains("choices[0].message.content")) {
            return "Gemini parsing error - " + sanitized;
        }
        return "Gemini HTTP request failed - " + sanitized;
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = value.replace(geminiApiKey, "[REDACTED]");
        return sanitized.length() <= 500 ? sanitized : sanitized.substring(0, 500) + "...";
    }

    private String preview(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 300 ? value : value.substring(0, 300);
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

    private String money(BigDecimal value) {
        return value == null ? "0.00" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
