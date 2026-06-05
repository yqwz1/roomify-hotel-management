package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.roomify.backend.dto.ai.AiAssistantChatMessage;
import com.roomify.backend.dto.ai.AiAssistantChatRequest;
import com.roomify.backend.dto.ai.AiAssistantChatResponse;
import com.roomify.backend.exception.GeminiApiException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);
    private static final String GEMINI_SOURCE = "GEMINI_API";
    private static final int MAX_HISTORY_MESSAGES = 6;

    private final AiAssistantContextBuilder contextBuilder;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String geminiApiKey;
    private final String geminiModel;
    private final String geminiBaseUrl;
    private final Duration requestTimeout;
    private final int maxOutputTokens;

    public AiAssistantService(
            AiAssistantContextBuilder contextBuilder,
            ObjectMapper objectMapper,
            @Value("${gemini.api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${gemini.model:gemini-2.5-flash}") String geminiModel,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String geminiBaseUrl,
            @Value("${gemini.timeout-ms:120000}") long timeoutMs,
            @Value("${gemini.max-output-tokens:600}") int maxOutputTokens) {
        this.contextBuilder = contextBuilder;
        this.objectMapper = objectMapper;
        this.geminiApiKey = trim(geminiApiKey);
        this.geminiModel = trim(geminiModel).isBlank() ? "gemini-2.5-flash" : trim(geminiModel);
        this.geminiBaseUrl = normalizeBaseUrl(geminiBaseUrl);
        this.requestTimeout = Duration.ofMillis(Math.max(timeoutMs, 1000L));
        this.maxOutputTokens = Math.max(maxOutputTokens, 1);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(requestTimeout)
                .build();
    }

    public AiAssistantChatResponse chat(AiAssistantChatRequest request) {
        AiAssistantContextBuilder.AiAssistantContext context = contextBuilder.buildContext();
        if (geminiApiKey.isBlank()) {
            throw new GeminiApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Gemini API key is missing. Please set GEMINI_API_KEY in .env.local.");
        }

        RoomiIntent intent = detectIntent(request.message(), context);
        try {
            String answer = isDeterministicCriticalIntent(intent)
                    ? buildGroundedAnswer(intent, context, "", request.message())
                    : buildGroundedAnswer(intent, context, askGemini(request, context, intent), request.message());
            return new AiAssistantChatResponse(
                    answer.trim(),
                    GEMINI_SOURCE,
                    false,
                    geminiModel,
                    dataSourcesFor(intent, context),
                    context.summaryText(),
                    context.suggestedPrompts(),
                    LocalDateTime.now());
        } catch (GeminiApiException exception) {
            throw exception;
        } catch (HttpTimeoutException exception) {
            log.warn("Gemini request timed out", exception);
            throw new GeminiApiException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini did not respond in time. Please try again.");
        } catch (IOException exception) {
            log.warn("Gemini request failed: {}", sanitizeProviderError(exception.getMessage()), exception);
            throw new GeminiApiException(HttpStatus.BAD_GATEWAY, "Gemini could not process the request. Please try again.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new GeminiApiException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini did not respond in time. Please try again.");
        }
    }

    private String askGemini(
            AiAssistantChatRequest request,
            AiAssistantContextBuilder.AiAssistantContext context,
            RoomiIntent intent) throws IOException, InterruptedException {
        String currentUserContent = buildGeminiUserContent(request.message(), context, intent);
        log.debug("Gemini prompt length={}, preview={}", currentUserContent.length(), preview(currentUserContent));

        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("systemInstruction", buildSystemInstruction());
        payload.set("contents", buildGeminiContents(request, currentUserContent));

        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        payload.set("generationConfig", generationConfig);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(geminiUrl()))
                .timeout(requestTimeout)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", geminiApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            handleGeminiError(response.statusCode(), response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String answer = root.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text")
                .asText(null);
        if (answer == null || answer.isBlank()) {
            throw new IOException("Gemini response parsing failed: candidates[0].content.parts[0].text missing");
        }
        return answer;
    }

    private ObjectNode buildSystemInstruction() {
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode parts = objectMapper.createArrayNode();
        parts.add(objectMapper.createObjectNode().put("text", """
                You are Roomie, the Roomify hotel operations copilot.
                You must answer using only the provided Roomify data snapshot.
                Treat Roomify database metrics and FASTAPI_MODEL outputs as authoritative.
                Do not invent, estimate, recalculate, smooth, or replace any numbers.
                Do not invent room types, guests, reservations, prices, revenue, occupancy, cancellations, services, payments, expenses, forecasts, or recommendations.
                If the requested data is not present in the snapshot, say exactly which data is missing.
                For forecasts and pricing, use FASTAPI_MODEL values exactly.
                For analytics, mention the metrics used.
                Keep answers concise and actionable.
                If a Facts section is provided in the user prompt, do not alter those facts; explain them only.
                For calculations, give the final result and a short explanation.
                """));
        systemInstruction.set("parts", parts);
        return systemInstruction;
    }

    private ArrayNode buildGeminiContents(AiAssistantChatRequest request, String currentUserContent) {
        List<NormalizedChatMessage> conversation = new ArrayList<>();
        if (request.history() != null) {
            request.history().stream()
                    .filter(Objects::nonNull)
                    .map(this::toNormalizedChatMessage)
                    .filter(Objects::nonNull)
                    .forEach(conversation::add);
        }
        conversation.add(new NormalizedChatMessage("user", currentUserContent));

        List<NormalizedChatMessage> normalized = normalizeConversation(conversation);
        int startInclusive = Math.max(0, normalized.size() - MAX_HISTORY_MESSAGES);
        while (startInclusive < normalized.size() && "assistant".equals(normalized.get(startInclusive).role())) {
            startInclusive++;
        }

        ArrayNode contents = objectMapper.createArrayNode();
        normalized.subList(startInclusive, normalized.size())
                .forEach(message -> contents.add(buildGeminiContent(message.role(), message.content())));
        return contents;
    }

    private ObjectNode buildGeminiContent(String role, String text) {
        ObjectNode content = objectMapper.createObjectNode();
        content.put("role", "assistant".equals(role) ? "model" : "user");
        ArrayNode parts = objectMapper.createArrayNode();
        parts.add(objectMapper.createObjectNode().put("text", text == null ? "" : text));
        content.set("parts", parts);
        return content;
    }

    private NormalizedChatMessage toNormalizedChatMessage(AiAssistantChatMessage message) {
        String role = trim(message.role()).toLowerCase();
        String content = trim(message.content());
        if (content.isBlank() || (!"user".equals(role) && !"assistant".equals(role))) {
            return null;
        }
        if ("assistant".equals(role) && isSyntheticSeedGreeting(content)) {
            return null;
        }
        return new NormalizedChatMessage(role, content);
    }

    private List<NormalizedChatMessage> normalizeConversation(List<NormalizedChatMessage> conversation) {
        List<NormalizedChatMessage> normalized = new ArrayList<>();
        for (NormalizedChatMessage message : conversation) {
            if (normalized.isEmpty()) {
                normalized.add(message);
                continue;
            }

            NormalizedChatMessage previous = normalized.get(normalized.size() - 1);
            if (previous.role().equals(message.role())) {
                normalized.set(normalized.size() - 1, new NormalizedChatMessage(
                        previous.role(),
                        mergeMessageContent(previous.content(), message.content())));
            } else {
                normalized.add(message);
            }
        }
        return normalized;
    }

    private boolean isSyntheticSeedGreeting(String content) {
        String normalized = content.toLowerCase();
        return normalized.contains("roomie")
                && normalized.contains("hotel management assistant");
    }

    private String mergeMessageContent(String first, String second) {
        if (first.isBlank() || first.equals(second)) {
            return second;
        }
        if (second.isBlank()) {
            return first;
        }
        return first + "\n\n" + second;
    }

    private String buildGeminiUserContent(
            String message,
            AiAssistantContextBuilder.AiAssistantContext context,
            RoomiIntent intent) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Roomify data snapshot. Use only these metrics; say what is missing instead of inventing data.\n")
                .append("Detected intent: ")
                .append(intent)
                .append("\n")
                .append("- ")
                .append(context.summaryText())
                .append("\n\n");
        appendRelevantSnapshot(prompt, context, intent);
        prompt.append("\nAuthoritative revenue forecast:\n");
        if (context.fastApiRevenueForecast() != null) {
            AiAssistantContextBuilder.FastApiRevenueForecast forecast = context.fastApiRevenueForecast();
            prompt.append("- Forecast source: ")
                    .append(forecast.source())
                    .append('\n')
                    .append("- Predicted revenue total: SAR ")
                    .append(money(forecast.predictedRevenueTotal()))
                    .append('\n')
                    .append("- Predicted average occupancy: ")
                    .append(formatPercent(forecast.predictedAverageOccupancy()))
                    .append('\n')
                    .append("- Forecast days: ")
                    .append(forecast.forecastDays())
                    .append('\n')
                    .append("- For forecast questions, quote these values exactly and do not calculate a different forecast.\n");
        } else {
            prompt.append("- FastAPI forecast is unavailable. For forecast questions, say the FastAPI forecast is unavailable.\n");
        }
        prompt.append("\nRoom type performance from ROOMIFY_DB:\n");

        context.roomTypeRevenue().stream()
                .filter(Objects::nonNull)
                .limit(5)
                .forEach(roomType -> prompt.append("- ")
                        .append(roomType.roomType())
                        .append(": revenue SAR ")
                        .append(roomType.revenue().toPlainString())
                        .append(", reservations ")
                        .append(roomType.reservations())
                        .append('\n'));

        prompt.append("\nPricing recommendations from FASTAPI_MODEL:\n");
        context.fastApiPricingRecommendations().stream()
                .filter(Objects::nonNull)
                .forEach(recommendation -> prompt.append("- ")
                        .append(recommendation.roomTypeName())
                        .append(": current SAR ")
                        .append(money(recommendation.currentPrice()))
                        .append(", suggested SAR ")
                        .append(money(recommendation.suggestedPrice()))
                        .append(", adjustment ")
                        .append(formatPercent(recommendation.adjustmentPercent()))
                        .append(", direction ")
                        .append(recommendation.direction())
                        .append(", risk ")
                        .append(recommendation.risk())
                        .append(", reason ")
                        .append(recommendation.reason())
                        .append('\n'));

        prompt.append("\nUpcoming/peak demand:\n");
        context.demandHeatmap().stream()
                .filter(Objects::nonNull)
                .sorted((left, right) -> Integer.compare(right.demandScore(), left.demandScore()))
                .limit(3)
                .forEach(point -> prompt.append("- ")
                        .append(point.date())
                        .append(": score ")
                        .append(point.demandScore())
                        .append(", occupancy ")
                        .append(point.occupancy())
                        .append("%, revenue SAR ")
                        .append(point.revenue().toPlainString())
                        .append('\n'));

        prompt.append("\nUser question:\n")
                .append(trim(message));
        return prompt.toString();
    }

    private RoomiIntent detectIntent(String message, AiAssistantContextBuilder.AiAssistantContext context) {
        String normalized = trim(message).toLowerCase();
        if (isRevenueForecastQuestion(message)) {
            return RoomiIntent.REVENUE_FORECAST;
        }
        if (normalized.contains("price") || normalized.contains("pricing") || normalized.contains("rate")) {
            return context.fastApiPricingRecommendations().stream()
                    .anyMatch(recommendation -> normalized.contains(recommendation.roomTypeName().toLowerCase()))
                    ? RoomiIntent.SPECIFIC_ROOM_TYPE_PRICING
                    : RoomiIntent.PRICING_RECOMMENDATION;
        }
        if (normalized.contains("occupancy")) {
            return RoomiIntent.OCCUPANCY;
        }
        if (normalized.contains("cancel")) {
            return RoomiIntent.CANCELLATION;
        }
        if (normalized.contains("reservation") || normalized.contains("booking")) {
            return RoomiIntent.RESERVATION;
        }
        if (normalized.contains("room type") || normalized.contains("performs best") || normalized.contains("performance")) {
            return RoomiIntent.ROOM_PERFORMANCE;
        }
        if (normalized.contains("service")) {
            return RoomiIntent.SERVICE_REQUESTS;
        }
        if (normalized.contains("payment") || normalized.contains("paid") || normalized.contains("unpaid")) {
            return RoomiIntent.PAYMENTS;
        }
        if (normalized.contains("expense") || normalized.contains("profit") || normalized.contains("cost")) {
            return RoomiIntent.EXPENSES;
        }
        if (normalized.contains("guest")) {
            return RoomiIntent.GUESTS;
        }
        if (normalized.contains("demand") || normalized.contains("heatmap")) {
            return RoomiIntent.DEMAND_HEATMAP;
        }
        if (normalized.contains("revenue")) {
            return RoomiIntent.REVENUE;
        }
        return RoomiIntent.GENERAL;
    }

    private boolean isRevenueForecastQuestion(String message) {
        String normalized = trim(message).toLowerCase();
        return normalized.contains("forecast next 30")
                || normalized.contains("predict next month")
                || normalized.contains("revenue forecast")
                || normalized.contains("financial prediction")
                || (normalized.contains("forecast") && normalized.contains("revenue"))
                || (normalized.contains("predict") && normalized.contains("revenue"));
    }

    private void appendRelevantSnapshot(
            StringBuilder prompt,
            AiAssistantContextBuilder.AiAssistantContext context,
            RoomiIntent intent) {
        AiAssistantContextBuilder.RoomifyDataSnapshot snapshot = context.snapshot();
        if (snapshot == null) {
            prompt.append("Roomify snapshot is missing.\n");
            return;
        }

        AiAssistantContextBuilder.HotelOverview overview = snapshot.hotelOverview();
        if (overview != null) {
            prompt.append("Hotel overview source ")
                    .append(overview.source())
                    .append(" (")
                    .append(overview.date())
                    .append("): total rooms ")
                    .append(overview.totalRooms())
                    .append(", available ")
                    .append(overview.availableRooms())
                    .append(", occupied ")
                    .append(overview.occupiedRooms())
                    .append(", occupancy ")
                    .append(formatPercent(overview.occupancyRate()))
                    .append(", active reservations ")
                    .append(overview.activeReservations())
                    .append(", check-ins today ")
                    .append(overview.checkInsToday())
                    .append(", check-outs today ")
                    .append(overview.checkOutsToday())
                    .append(", guests ")
                    .append(overview.guestCount())
                    .append(".\n");
        }
        switch (intent) {
            case REVENUE, REVENUE_FORECAST, EXPENSES, PAYMENTS -> appendFinanceSnapshot(prompt, snapshot.finance());
            case RESERVATION, CANCELLATION -> appendReservationSnapshot(prompt, snapshot.reservations());
            case ROOM_PERFORMANCE -> appendRoomPerformanceSnapshot(prompt, snapshot.roomPerformance());
            case SERVICE_REQUESTS -> appendServicesSnapshot(prompt, snapshot.services());
            case PRICING_RECOMMENDATION, SPECIFIC_ROOM_TYPE_PRICING, DEMAND_HEATMAP, OCCUPANCY, GUESTS, GENERAL -> {
                appendFinanceSnapshot(prompt, snapshot.finance());
                appendReservationSnapshot(prompt, snapshot.reservations());
            }
        }
    }

    private void appendFinanceSnapshot(StringBuilder prompt, AiAssistantContextBuilder.FinanceSnapshot finance) {
        if (finance == null) {
            prompt.append("Finance data is not available in the current Roomify snapshot.\n");
            return;
        }
        prompt.append("Finance source ")
                .append(finance.source())
                .append(" (")
                .append(finance.dateRange())
                .append("): current week revenue SAR ")
                .append(money(finance.currentWeekRevenue()))
                .append(", previous week revenue SAR ")
                .append(money(finance.previousWeekRevenue()))
                .append(", revenue change ")
                .append(formatPercent(finance.revenueChangePercentage()))
                .append(", current month revenue SAR ")
                .append(money(finance.currentMonthRevenue()))
                .append(", payments received SAR ")
                .append(money(finance.paymentsReceived()))
                .append(", pending payments SAR ")
                .append(money(finance.pendingPayments()))
                .append(", current week expenses SAR ")
                .append(money(finance.currentWeekExpenses()))
                .append(", net profit SAR ")
                .append(money(finance.netProfit()))
                .append(".\n");
    }

    private void appendReservationSnapshot(StringBuilder prompt, AiAssistantContextBuilder.ReservationSnapshot reservations) {
        if (reservations == null) {
            prompt.append("Reservation data is not available in the current Roomify snapshot.\n");
            return;
        }
        prompt.append("Reservation source ")
                .append(reservations.source())
                .append(": total ")
                .append(reservations.reservationCount())
                .append(", active ")
                .append(reservations.activeReservations())
                .append(", confirmed ")
                .append(reservations.confirmedReservations())
                .append(", pending ")
                .append(reservations.pendingReservations())
                .append(", cancelled ")
                .append(reservations.cancelledReservations())
                .append(", cancellation rate ")
                .append(formatPercent(reservations.cancellationRate()))
                .append(".\n");
    }

    private void appendRoomPerformanceSnapshot(StringBuilder prompt, AiAssistantContextBuilder.RoomPerformanceSnapshot roomPerformance) {
        if (roomPerformance == null || roomPerformance.roomTypes().isEmpty()) {
            prompt.append("Room performance data is not available in the current Roomify snapshot.\n");
            return;
        }
        prompt.append("Room performance source ").append(roomPerformance.source()).append(":\n");
        roomPerformance.roomTypes().forEach(roomType -> prompt.append("- ")
                .append(roomType.roomTypeName())
                .append(": revenue SAR ")
                .append(money(roomType.revenue()))
                .append(", reservations ")
                .append(roomType.reservations())
                .append(", ADR SAR ")
                .append(money(roomType.averageDailyRate()))
                .append('\n'));
    }

    private void appendServicesSnapshot(StringBuilder prompt, AiAssistantContextBuilder.ServicesSnapshot services) {
        if (services == null) {
            prompt.append("Service data is not available in the current Roomify snapshot.\n");
            return;
        }
        prompt.append("Services source ")
                .append(services.source())
                .append(" (")
                .append(services.dateRange())
                .append("): service revenue SAR ")
                .append(money(services.serviceRevenue()))
                .append(", pending requests ")
                .append(services.pendingServiceRequests())
                .append(", in progress ")
                .append(services.inProgressServiceRequests())
                .append(", completed ")
                .append(services.completedServiceRequests())
                .append(", usage cost SAR ")
                .append(money(services.serviceUsageCost()))
                .append(". Top requested services: ");
        if (services.topRequestedServices().isEmpty()) {
            prompt.append("unavailable");
        } else {
            prompt.append(services.topRequestedServices().stream()
                    .map(service -> service.serviceName() + " (" + service.count() + ")")
                    .collect(java.util.stream.Collectors.joining(", ")));
        }
        prompt.append(".\n");
    }

    private String buildGroundedAnswer(
            RoomiIntent intent,
            AiAssistantContextBuilder.AiAssistantContext context,
            String geminiAnswer,
            String userMessage) {
        return switch (intent) {
            case REVENUE_FORECAST -> buildAuthoritativeForecastAnswer(context);
            case PRICING_RECOMMENDATION -> buildAuthoritativePricingAnswer(context, null);
            case SPECIFIC_ROOM_TYPE_PRICING -> buildAuthoritativePricingAnswer(context, matchingRoomType(context, userMessage));
            case OCCUPANCY -> buildOccupancyAnswer(context);
            case ROOM_PERFORMANCE -> buildRoomPerformanceAnswer(context);
            case PAYMENTS -> buildPaymentAnswer(context);
            case CANCELLATION -> buildCancellationAnswer(context);
            case SERVICE_REQUESTS -> buildServiceAnswer(context);
            default -> geminiAnswer;
        };
    }

    private String buildAuthoritativeForecastAnswer(
            AiAssistantContextBuilder.AiAssistantContext context,
            String ignored) {
        return buildAuthoritativeForecastAnswer(context);
    }

    private String buildAuthoritativeForecastAnswer(
            AiAssistantContextBuilder.AiAssistantContext context) {
        AiAssistantContextBuilder.FastApiRevenueForecast forecast = context.fastApiRevenueForecast();
        if (forecast == null) {
            return """
                    Data source: FASTAPI_MODEL
                    Explanation by: Gemini

                    Facts:
                    - Forecast source: FASTAPI_MODEL
                    - FastAPI forecast is unavailable.

                    Explanation:
                    - I cannot provide a revenue forecast number until the AI Finance forecast endpoint returns data.

                    Actions:
                    - Check the AI Finance service status.
                    - Retry the forecast request after FastAPI returns forecast data.
                    """;
        }

        return "Data source: " + forecast.source() + "\n"
                + "Explanation by: Gemini\n\n"
                + "Facts:\n"
                + "- Forecast source: " + forecast.source() + "\n"
                + "- Predicted revenue total: SAR " + money(forecast.predictedRevenueTotal()) + "\n"
                + "- Predicted average occupancy: " + formatPercent(forecast.predictedAverageOccupancy()) + "\n"
                + "- Forecast days: " + forecast.forecastDays() + "\n\n"
                + "Explanation:\n"
                + "- This is the authoritative AI Finance forecast and should be used for revenue planning.\n\n"
                + "Actions:\n"
                + "- Align staffing and inventory with the projected occupancy.\n"
                + "- Review weekend pricing and cancellation trends before changing rates.";
    }

    private String buildAuthoritativePricingAnswer(
            AiAssistantContextBuilder.AiAssistantContext context,
            String roomTypeFilter) {
        List<AiAssistantContextBuilder.FastApiPricingRecommendation> recommendations = context.fastApiPricingRecommendations();
        if (recommendations == null || recommendations.isEmpty()) {
            return """
                    Data source: FASTAPI_MODEL
                    Explanation by: Gemini

                    Facts:
                    - FastAPI pricing recommendations are unavailable.

                    Explanation:
                    - I cannot recommend prices without the AI Finance pricing table.

                    Actions:
                    - Check the AI Finance pricing endpoint.
                    - Retry after FASTAPI_MODEL returns recommendations.
                    """;
        }
        List<AiAssistantContextBuilder.FastApiPricingRecommendation> selected = recommendations;
        if (roomTypeFilter != null && !roomTypeFilter.isBlank()) {
            String normalized = roomTypeFilter.toLowerCase();
            selected = recommendations.stream()
                    .filter(recommendation -> recommendation.roomTypeName().equalsIgnoreCase(roomTypeFilter)
                            || recommendation.roomTypeName().toLowerCase().contains(normalized))
                    .toList();
        }
        StringBuilder answer = new StringBuilder("Data source: FASTAPI_MODEL\nExplanation by: Gemini\n\nFacts:\n");
        selected.forEach(recommendation -> answer.append("- ")
                .append(recommendation.roomTypeName())
                .append(": current price SAR ")
                .append(money(recommendation.currentPrice()))
                .append(", suggested price SAR ")
                .append(money(recommendation.suggestedPrice()))
                .append(", adjustment ")
                .append(formatPercent(recommendation.adjustmentPercent()))
                .append(" ")
                .append(recommendation.direction())
                .append(", risk ")
                .append(recommendation.risk())
                .append(", reason: ")
                .append(recommendation.reason())
                .append(", source ")
                .append(recommendation.source())
                .append('\n'));
        answer.append("\nExplanation:\n")
                .append("- These prices are copied from the AI Finance FASTAPI_MODEL pricing table.\n\n")
                .append("Actions:\n")
                .append("- Apply changes only after reviewing occupancy, cancellations, and demand for the target dates.\n")
                .append("- Keep the listed direction exactly as FASTAPI_MODEL returned it.");
        return answer.toString();
    }

    private String matchingRoomType(AiAssistantContextBuilder.AiAssistantContext context, String userMessage) {
        String normalized = trim(userMessage).toLowerCase();
        return context.fastApiPricingRecommendations().stream()
                .map(AiAssistantContextBuilder.FastApiPricingRecommendation::roomTypeName)
                .filter(roomType -> normalized.contains(roomType.toLowerCase()))
                .sorted((left, right) -> Integer.compare(right.length(), left.length()))
                .findFirst()
                .orElse(null);
    }

    private String buildOccupancyAnswer(AiAssistantContextBuilder.AiAssistantContext context) {
        AiAssistantContextBuilder.HotelOverview overview = context.snapshot().hotelOverview();
        return "Data source: ROOMIFY_DB\nExplanation by: Gemini\n\n"
                + "Facts:\n"
                + "- Total rooms: " + overview.totalRooms() + "\n"
                + "- Occupied rooms: " + overview.occupiedRooms() + "\n"
                + "- Available rooms: " + overview.availableRooms() + "\n"
                + "- Occupancy rate: " + formatPercent(overview.occupancyRate()) + "\n\n"
                + "Explanation:\n"
                + "- Occupancy is calculated from current room statuses in Roomify.\n\n"
                + "Actions:\n"
                + "- Review occupied and available inventory before changing rates.\n"
                + "- Use demand heatmap data for date-specific staffing decisions.";
    }

    private String buildRoomPerformanceAnswer(AiAssistantContextBuilder.AiAssistantContext context) {
        AiAssistantContextBuilder.RoomPerformanceSnapshot performance = context.snapshot().roomPerformance();
        if (performance.bestPerformingRoomType() == null) {
            return unavailable("ROOMIFY_DB", "Room performance data is not available in the current Roomify snapshot.");
        }
        AiAssistantContextBuilder.RoomTypePerformance best = performance.bestPerformingRoomType();
        return "Data source: ROOMIFY_DB\nExplanation by: Gemini\n\n"
                + "Facts:\n"
                + "- Best performing room type: " + best.roomTypeName() + "\n"
                + "- Revenue: SAR " + money(best.revenue()) + "\n"
                + "- Reservations: " + best.reservations() + "\n"
                + "- ADR: SAR " + money(best.averageDailyRate()) + "\n\n"
                + "Explanation:\n"
                + "- Best performance is based on the highest recorded room-type revenue in Roomify.\n\n"
                + "Actions:\n"
                + "- Protect availability for the best performing room type on high-demand dates.\n"
                + "- Compare the weakest room type before changing promotions.";
    }

    private String buildPaymentAnswer(AiAssistantContextBuilder.AiAssistantContext context) {
        AiAssistantContextBuilder.FinanceSnapshot finance = context.snapshot().finance();
        return "Data source: ROOMIFY_DB\nExplanation by: Gemini\n\n"
                + "Facts:\n"
                + "- Payments received: SAR " + money(finance.paymentsReceived()) + "\n"
                + "- Pending/unpaid payments: SAR " + money(finance.pendingPayments()) + "\n\n"
                + "Explanation:\n"
                + "- Payment issues are represented by non-paid, non-refunded payment amounts in Roomify.\n\n"
                + "Actions:\n"
                + "- Review pending and unpaid reservations before checkout.\n"
                + "- Follow up on failed or partially paid payments.";
    }

    private String buildCancellationAnswer(AiAssistantContextBuilder.AiAssistantContext context) {
        AiAssistantContextBuilder.ReservationSnapshot reservations = context.snapshot().reservations();
        return "Data source: ROOMIFY_DB\nExplanation by: Gemini\n\n"
                + "Facts:\n"
                + "- Total reservations: " + reservations.reservationCount() + "\n"
                + "- Cancelled reservations: " + reservations.cancelledReservations() + "\n"
                + "- Cancellation rate: " + formatPercent(reservations.cancellationRate()) + "\n"
                + "- Top cancellation cause: " + context.cancellationInsight().reason() + "\n\n"
                + "Explanation:\n"
                + "- Cancellation summary uses reservation statuses and captured cancellation reasons.\n\n"
                + "Actions:\n"
                + "- Review the top cancellation cause before changing policy.\n"
                + "- Monitor cancellations before weekend pricing changes.";
    }

    private String buildServiceAnswer(AiAssistantContextBuilder.AiAssistantContext context) {
        AiAssistantContextBuilder.ServicesSnapshot services = context.snapshot().services();
        String topServices = services.topRequestedServices().isEmpty()
                ? "service request data is unavailable"
                : services.topRequestedServices().stream()
                        .map(service -> service.serviceName() + " (" + service.count() + ")")
                        .collect(java.util.stream.Collectors.joining(", "));
        return "Data source: ROOMIFY_DB\nExplanation by: Gemini\n\n"
                + "Facts:\n"
                + "- Top requested services: " + topServices + "\n"
                + "- Pending service requests: " + services.pendingServiceRequests() + "\n"
                + "- Completed service requests: " + services.completedServiceRequests() + "\n"
                + "- Service revenue: SAR " + money(services.serviceRevenue()) + "\n\n"
                + "Explanation:\n"
                + "- Service summary uses Roomify service requests and service charge records.\n\n"
                + "Actions:\n"
                + "- Prioritize pending high-demand service categories.\n"
                + "- Compare service revenue with usage cost before changing staffing.";
    }

    private String unavailable(String source, String message) {
        return "Data source: " + source + "\nExplanation by: Gemini\n\nFacts:\n- " + message
                + "\n\nExplanation:\n- No replacement number was generated.\n\nActions:\n- Add the missing data to Roomify, then ask Roomie again.";
    }

    private List<String> dataSourcesFor(RoomiIntent intent, AiAssistantContextBuilder.AiAssistantContext context) {
        List<String> sources = new ArrayList<>();
        sources.add("GEMINI_EXPLANATION");
        if (intent == RoomiIntent.REVENUE_FORECAST
                || intent == RoomiIntent.PRICING_RECOMMENDATION
                || intent == RoomiIntent.SPECIFIC_ROOM_TYPE_PRICING
                || intent == RoomiIntent.DEMAND_HEATMAP) {
            sources.add("FASTAPI_MODEL");
        }
        if (context.snapshot() != null && intent != RoomiIntent.REVENUE_FORECAST) {
            sources.add("ROOMIFY_DB");
        }
        return sources.stream().distinct().toList();
    }

    private boolean isDeterministicCriticalIntent(RoomiIntent intent) {
        return intent == RoomiIntent.REVENUE_FORECAST
                || intent == RoomiIntent.PRICING_RECOMMENDATION
                || intent == RoomiIntent.SPECIFIC_ROOM_TYPE_PRICING
                || intent == RoomiIntent.OCCUPANCY
                || intent == RoomiIntent.ROOM_PERFORMANCE
                || intent == RoomiIntent.PAYMENTS
                || intent == RoomiIntent.CANCELLATION
                || intent == RoomiIntent.SERVICE_REQUESTS;
    }

    private void handleGeminiError(int statusCode, String body) {
        String sanitizedBody = truncate(body);
        log.warn("Gemini returned HTTP {}: {}", statusCode, sanitizedBody);
        if (statusCode == 401 || statusCode == 403) {
            throw new GeminiApiException(HttpStatus.UNAUTHORIZED, "Gemini API key is invalid or unauthorized.");
        }
        if (statusCode == 429) {
            throw new GeminiApiException(HttpStatus.TOO_MANY_REQUESTS, "Gemini rate limit reached. Please try again later.");
        }
        throw new GeminiApiException(HttpStatus.BAD_GATEWAY, "Gemini could not process the request. Please try again.");
    }

    private String sanitizeProviderError(String message) {
        if (message == null || message.isBlank()) {
            return "Unknown Gemini error";
        }
        return message.replace(geminiApiKey, "[REDACTED]");
    }

    private String geminiUrl() {
        return geminiBaseUrl + "/" + geminiModel + ":generateContent";
    }

    private String normalizeBaseUrl(String baseUrl) {
        String value = trim(baseUrl);
        if (value.isBlank()) {
            value = "https://generativelanguage.googleapis.com/v1beta/models";
        }
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = sanitizeProviderError(value);
        return sanitized.length() <= 500 ? sanitized : sanitized.substring(0, 500) + "...";
    }

    private String money(java.math.BigDecimal value) {
        return value == null
                ? "0.00"
                : String.format(java.util.Locale.US, "%,.2f", value.setScale(2, java.math.RoundingMode.HALF_UP));
    }

    private String formatPercent(double value) {
        return String.format(java.util.Locale.US, "%.2f%%", value);
    }

    private String preview(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 300 ? value : value.substring(0, 300);
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private record NormalizedChatMessage(String role, String content) {
    }

    private enum RoomiIntent {
        REVENUE,
        REVENUE_FORECAST,
        PRICING_RECOMMENDATION,
        SPECIFIC_ROOM_TYPE_PRICING,
        OCCUPANCY,
        CANCELLATION,
        RESERVATION,
        ROOM_PERFORMANCE,
        SERVICE_REQUESTS,
        PAYMENTS,
        EXPENSES,
        GUESTS,
        DEMAND_HEATMAP,
        GENERAL
    }
}
