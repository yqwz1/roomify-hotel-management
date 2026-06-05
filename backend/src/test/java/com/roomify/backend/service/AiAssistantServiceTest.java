package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.dto.ai.AiAssistantChatMessage;
import com.roomify.backend.dto.ai.AiAssistantChatRequest;
import com.roomify.backend.dto.ai.AiAssistantChatResponse;
import com.roomify.backend.dto.ai.AiFinanceSummaryResponse;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import com.roomify.backend.exception.GeminiApiException;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiAssistantServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final AtomicReference<String> apiKeyHeader = new AtomicReference<>();
    private final AtomicInteger responseStatus = new AtomicInteger(200);
    private final AtomicInteger responseDelayMillis = new AtomicInteger(0);
    private final AtomicReference<String> responseBody = new AtomicReference<>("""
            {"candidates":[{"content":{"parts":[{"text":"Gemini answer"}]}}]}
            """);

    private HttpServer server;
    private AiAssistantService service;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/models/gemini-2.5-flash:generateContent", this::handleGenerateContent);
        server.start();

        service = new AiAssistantService(
                mockContextBuilder(),
                objectMapper,
                "test-gemini-key",
                "gemini-2.5-flash",
                "http://127.0.0.1:" + server.getAddress().getPort() + "/models",
                5000,
                600);
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void sendsGenerateContentRequestWithApiKeyAndModel() throws Exception {
        AiAssistantChatResponse response = service.chat(new AiAssistantChatRequest("2+5", List.of()));

        assertThat(response.source()).isEqualTo("GEMINI_API");
        assertThat(response.fallbackUsed()).isFalse();
        assertThat(response.model()).isEqualTo("gemini-2.5-flash");
        assertThat(response.answer()).isEqualTo("Gemini answer");
        assertThat(apiKeyHeader.get()).isEqualTo("test-gemini-key");

        JsonNode root = objectMapper.readTree(requestBody.get());
        assertThat(root.path("systemInstruction").path("parts").path(0).path("text").asText())
                .contains("You are Roomie", "Do not invent", "using only the provided Roomify data snapshot");
        assertThat(root.path("generationConfig").path("maxOutputTokens").asInt()).isEqualTo(600);
        assertThat(root.path("contents").path(0).path("role").asText()).isEqualTo("user");
        assertThat(root.toString()).contains("Weekly revenue: SAR 1000.00");
    }

    @Test
    void forecastPromptIncludesFastApiForecastValues() throws Exception {
        AiAssistantChatResponse response = service.chat(new AiAssistantChatRequest("Forecast next 30 days revenue", List.of()));

        assertThat(response.answer())
                .contains("Forecast source: FASTAPI_MODEL")
                .contains("Predicted revenue total: SAR 369,645.50")
                .contains("Predicted average occupancy: 83.33%")
                .contains("Forecast days: 30")
                .doesNotContain("78525.19");
    }

    @Test
    void forecastQuestionUsesAuthoritativeFastApiNumbersEvenWhenGeminiReturnsDifferentNumber() {
        responseBody.set("""
                {"candidates":[{"content":{"parts":[{"text":"Projected next month revenue: SAR 78525.19 with occupancy 40%."}]}}]}
                """);

        AiAssistantChatResponse response = service.chat(new AiAssistantChatRequest("Forecast next 30 days revenue", List.of()));

        assertThat(response.answer())
                .contains("Forecast source: FASTAPI_MODEL")
                .contains("Predicted revenue total: SAR 369,645.50")
                .contains("Predicted average occupancy: 83.33%")
                .contains("Forecast days: 30")
                .contains("Actions:")
                .doesNotContain("78525.19")
                .doesNotContain("40%");
    }

    @Test
    void forecastQuestionReportsUnavailableWhenFastApiForecastIsMissing() {
        AiAssistantService missingForecastService = new AiAssistantService(
                mockContextBuilderWithoutForecast(),
                objectMapper,
                "test-gemini-key",
                "gemini-2.5-flash",
                "http://127.0.0.1:" + server.getAddress().getPort() + "/models",
                5000,
                600);

        AiAssistantChatResponse response = missingForecastService.chat(
                new AiAssistantChatRequest("Predict next month revenue", List.of()));

        assertThat(response.answer())
                .contains("Forecast source: FASTAPI_MODEL")
                .contains("FastAPI forecast is unavailable")
                .doesNotContain("SAR 78525.19");
    }

    @Test
    void pricingQuestionUsesFastApiRecommendationsExactly() {
        responseBody.set("""
                {"candidates":[{"content":{"parts":[{"text":"Decrease Demo Deluxe to SAR 300."}]}}]}
                """);

        AiAssistantChatResponse response = service.chat(new AiAssistantChatRequest("Recommend prices for next week", List.of()));

        assertThat(response.answer())
                .contains("Data source: FASTAPI_MODEL")
                .contains("Demo Deluxe: current price SAR 350.00, suggested price SAR 380.00")
                .contains("8.57% increase")
                .contains("risk LOW")
                .contains("High demand supports rate increase")
                .doesNotContain("SAR 300")
                .doesNotContain("Decrease Demo Deluxe");
        assertThat(response.dataSources()).contains("FASTAPI_MODEL", "GEMINI_EXPLANATION");
    }

    @Test
    void specificRoomTypePricingReturnsExactFastApiRoom() {
        AiAssistantChatResponse response = service.chat(new AiAssistantChatRequest("Demo Deluxe pricing recommendation", List.of()));

        assertThat(response.answer())
                .contains("Demo Deluxe")
                .contains("current price SAR 350.00")
                .contains("suggested price SAR 380.00")
                .contains("source FASTAPI_MODEL");
    }

    @Test
    void occupancyQuestionUsesRoomifyDbSnapshot() {
        AiAssistantChatResponse response = service.chat(new AiAssistantChatRequest("Analyze occupancy trend", List.of()));

        assertThat(response.answer())
                .contains("Data source: ROOMIFY_DB")
                .contains("Total rooms: 20")
                .contains("Occupied rooms: 14")
                .contains("Occupancy rate: 70.00%");
    }

    @Test
    void normalizesHistoryAndConvertsAssistantToGeminiModelRole() throws Exception {
        service.chat(new AiAssistantChatRequest(
                "Final question",
                List.of(
                        new AiAssistantChatMessage("assistant", "Hello! I am Roomie, your hotel management assistant."),
                        new AiAssistantChatMessage("user", "Previous question"),
                        new AiAssistantChatMessage("assistant", "Previous answer"),
                        new AiAssistantChatMessage("user", "   "),
                        new AiAssistantChatMessage("system", "not allowed"))));

        JsonNode contents = objectMapper.readTree(requestBody.get()).path("contents");
        assertThat(contents.toString()).doesNotContain("hotel management assistant");
        assertThat(contents.get(0).path("role").asText()).isEqualTo("user");
        assertThat(contents.get(1).path("role").asText()).isEqualTo("model");
        assertThat(contents.get(contents.size() - 1).path("role").asText()).isEqualTo("user");
        assertThat(contents.size()).isLessThanOrEqualTo(6);
    }

    @Test
    void missingApiKeyReturnsConfiguredMessage() {
        AiAssistantService missingKeyService = new AiAssistantService(
                mockContextBuilder(),
                objectMapper,
                "",
                "gemini-2.5-flash",
                "http://127.0.0.1:" + server.getAddress().getPort() + "/models",
                5000,
                600);

        assertThatThrownBy(() -> missingKeyService.chat(new AiAssistantChatRequest("2+5", List.of())))
                .isInstanceOf(GeminiApiException.class)
                .hasMessage("Gemini API key is missing. Please set GEMINI_API_KEY in .env.local.");
    }

    @Test
    void unauthorizedGeminiResponseReturnsInvalidKeyMessage() {
        responseStatus.set(403);
        responseBody.set("{\"error\":{\"message\":\"permission denied\"}}");

        assertThatThrownBy(() -> service.chat(new AiAssistantChatRequest("2+5", List.of())))
                .isInstanceOf(GeminiApiException.class)
                .hasMessage("Gemini API key is invalid or unauthorized.");
    }

    @Test
    void rateLimitGeminiResponseReturnsRateLimitMessage() {
        responseStatus.set(429);
        responseBody.set("{\"error\":{\"message\":\"quota exceeded\"}}");

        assertThatThrownBy(() -> service.chat(new AiAssistantChatRequest("2+5", List.of())))
                .isInstanceOf(GeminiApiException.class)
                .hasMessage("Gemini rate limit reached. Please try again later.");
    }

    @Test
    void timeoutReturnsGeminiTimeoutMessage() {
        responseDelayMillis.set(1500);
        AiAssistantService timeoutService = new AiAssistantService(
                mockContextBuilder(),
                objectMapper,
                "test-gemini-key",
                "gemini-2.5-flash",
                "http://127.0.0.1:" + server.getAddress().getPort() + "/models",
                1000,
                600);

        assertThatThrownBy(() -> timeoutService.chat(new AiAssistantChatRequest("2+5", List.of())))
                .isInstanceOf(GeminiApiException.class)
                .hasMessage("Gemini did not respond in time. Please try again.");
    }

    private void handleGenerateContent(HttpExchange exchange) throws IOException {
        apiKeyHeader.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
        requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
        if (responseDelayMillis.get() > 0) {
            try {
                Thread.sleep(responseDelayMillis.get());
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }
        byte[] body = responseBody.get().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(responseStatus.get(), body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    private AiAssistantContextBuilder mockContextBuilder() {
        AiAssistantContextBuilder contextBuilder = mock(AiAssistantContextBuilder.class);
        when(contextBuilder.buildContext()).thenReturn(new AiAssistantContextBuilder.AiAssistantContext(
                new AiFinanceSummaryResponse(
                        new BigDecimal("1000.00"),
                        new BigDecimal("800.00"),
                        25.0,
                        70.0,
                        "Deluxe",
                        new BigDecimal("100.00"),
                        new BigDecimal("900.00")),
                List.of(),
                List.of(),
                List.of(),
                new RoomTypeRevenueResponse("Demo Deluxe", new BigDecimal("5000.00"), 12, new BigDecimal("416.67")),
                new AiAssistantContextBuilder.MonthPerformance(6, "June", 70.0),
                new AiAssistantContextBuilder.CancellationInsight("Guest requested cancellation", 2, 5),
                new AiAssistantContextBuilder.FastApiRevenueForecast(
                        new BigDecimal("369645.50"),
                        83.33,
                        30,
                        "FASTAPI_MODEL"),
                List.of(new AiAssistantContextBuilder.FastApiPricingRecommendation(
                        "Demo Deluxe",
                        new BigDecimal("350.00"),
                        new BigDecimal("380.00"),
                        8.57,
                        "increase",
                        "LOW",
                        "High demand supports rate increase",
                        "FASTAPI_MODEL")),
                null,
                snapshot(true),
                "Weekly revenue: SAR 1000.00 (change 25.0%). Current occupancy is 70.0%. Top cancellation cause: Guest requested cancellation (2 of 5 cancellations). Authoritative revenue forecast source: FASTAPI_MODEL, predicted revenue total SAR 369,645.50 over 30 days, predicted average occupancy 83.33%.",
                List.of("Why did revenue drop this week?")));
        return contextBuilder;
    }

    private AiAssistantContextBuilder mockContextBuilderWithoutForecast() {
        AiAssistantContextBuilder contextBuilder = mock(AiAssistantContextBuilder.class);
        when(contextBuilder.buildContext()).thenReturn(new AiAssistantContextBuilder.AiAssistantContext(
                new AiFinanceSummaryResponse(
                        new BigDecimal("1000.00"),
                        new BigDecimal("800.00"),
                        25.0,
                        70.0,
                        "Deluxe",
                        new BigDecimal("100.00"),
                        new BigDecimal("900.00")),
                List.of(),
                List.of(),
                List.of(),
                null,
                new AiAssistantContextBuilder.MonthPerformance(6, "June", 70.0),
                new AiAssistantContextBuilder.CancellationInsight("Guest requested cancellation", 2, 5),
                null,
                List.of(),
                null,
                snapshot(false),
                "Weekly revenue: SAR 1000.00 (change 25.0%). Current occupancy is 70.0%. FastAPI forecast is unavailable.",
                List.of("Why did revenue drop this week?")));
        return contextBuilder;
    }

    private AiAssistantContextBuilder.RoomifyDataSnapshot snapshot(boolean withForecast) {
        AiAssistantContextBuilder.FastApiRevenueForecast forecast = withForecast
                ? new AiAssistantContextBuilder.FastApiRevenueForecast(new BigDecimal("369645.50"), 83.33, 30, "FASTAPI_MODEL")
                : null;
        List<AiAssistantContextBuilder.FastApiPricingRecommendation> pricing = withForecast
                ? List.of(new AiAssistantContextBuilder.FastApiPricingRecommendation(
                        "Demo Deluxe",
                        new BigDecimal("350.00"),
                        new BigDecimal("380.00"),
                        8.57,
                        "increase",
                        "LOW",
                        "High demand supports rate increase",
                        "FASTAPI_MODEL"))
                : List.of();
        return new AiAssistantContextBuilder.RoomifyDataSnapshot(
                java.time.LocalDateTime.now(),
                new AiAssistantContextBuilder.HotelOverview(20, 6, 14, 70.0, 10, 2, 1, 18, "ROOMIFY_DB", "2026-06-01"),
                new AiAssistantContextBuilder.FinanceSnapshot(
                        new BigDecimal("1000.00"),
                        new BigDecimal("800.00"),
                        25.0,
                        new BigDecimal("4000.00"),
                        new BigDecimal("900.00"),
                        new BigDecimal("100.00"),
                        new BigDecimal("100.00"),
                        new BigDecimal("80.00"),
                        new BigDecimal("900.00"),
                        "ROOMIFY_DB",
                        "2026-05-26 to 2026-06-01"),
                new AiAssistantContextBuilder.ReservationSnapshot(20, 10, 8, 2, 5, 25.0, "ROOMIFY_DB", "all reservations"),
                new AiAssistantContextBuilder.RoomPerformanceSnapshot(
                        List.of(new AiAssistantContextBuilder.RoomTypePerformance(
                                "Demo Deluxe", 12, new BigDecimal("5000.00"), null, new BigDecimal("416.67"), "ROOMIFY_DB")),
                        new AiAssistantContextBuilder.RoomTypePerformance(
                                "Demo Deluxe", 12, new BigDecimal("5000.00"), null, new BigDecimal("416.67"), "ROOMIFY_DB"),
                        null,
                        "ROOMIFY_DB"),
                new AiAssistantContextBuilder.ServicesSnapshot(
                        List.of(new AiAssistantContextBuilder.ServiceMetric("HOUSEKEEPING", 4)),
                        new BigDecimal("250.00"),
                        2,
                        1,
                        5,
                        new BigDecimal("75.00"),
                        "ROOMIFY_DB",
                        "2026-06-01"),
                new AiAssistantContextBuilder.FastApiSnapshot(
                        forecast,
                        pricing,
                        new AiAssistantContextBuilder.PricingSummary(pricing.size(), "Demo Deluxe", 8.57, "FASTAPI_MODEL"),
                        List.of(),
                        "FASTAPI_MODEL"));
    }
}
