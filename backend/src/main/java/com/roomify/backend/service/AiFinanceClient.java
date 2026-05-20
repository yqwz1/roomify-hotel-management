package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;

@Service
public class AiFinanceClient {

    private static final Logger log = LoggerFactory.getLogger(AiFinanceClient.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String baseUrl;
    private final Duration timeout;

    public AiFinanceClient(
            ObjectMapper objectMapper,
            @Value("${roomify.ai-service.base-url:http://localhost:8000}") String baseUrl,
            @Value("${roomify.ai-service.timeout-ms:3000}") long timeoutMs) {
        this.objectMapper = objectMapper;
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.timeout = Duration.ofMillis(Math.max(timeoutMs, 1L));
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(this.timeout)
                .build();
    }

    public AiServiceCallResult getHealth() {
        return executeGet("/health");
    }

    public AiServiceCallResult getModelInfo() {
        return executeGet("/model-info");
    }

    public AiServiceCallResult getRevenueForecast() {
        return executePost("/forecast/full", "{}");
    }

    public AiServiceCallResult getPricingRecommendations() {
        return executePost("/pricing/recommendations", null);
    }

    public AiServiceCallResult simulateElasticity(Object requestBody) {
        return executePost("/elasticity/simulate", requestBody);
    }

    private AiServiceCallResult executeGet(String path) {
        HttpRequest request;
        try {
            request = baseRequest(path)
                    .GET()
                    .build();
        } catch (RuntimeException exception) {
            return fail(path, "invalid AI service configuration: " + exception.getMessage(), exception);
        }
        return execute(request, path);
    }

    private AiServiceCallResult executePost(String path, String jsonBody) {
        HttpRequest.BodyPublisher bodyPublisher = jsonBody == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(jsonBody);
        return executePost(path, bodyPublisher, jsonBody != null);
    }

    private AiServiceCallResult executePost(String path, Object requestBody) {
        try {
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            return executePost(path, HttpRequest.BodyPublishers.ofString(jsonBody), true);
        } catch (IOException exception) {
            return fail(path, "failed to serialize AI service request: " + exception.getMessage(), exception);
        }
    }

    private AiServiceCallResult executePost(String path, HttpRequest.BodyPublisher bodyPublisher, boolean includeJsonHeader) {
        HttpRequest request;
        try {
            HttpRequest.Builder builder = baseRequest(path)
                    .POST(bodyPublisher);
            if (includeJsonHeader) {
                builder.header("Content-Type", "application/json");
            }
            request = builder.build();
        } catch (RuntimeException exception) {
            return fail(path, "invalid AI service configuration: " + exception.getMessage(), exception);
        }
        return execute(request, path);
    }

    private HttpRequest.Builder baseRequest(String path) {
        return HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .timeout(timeout)
                .header("Accept", "application/json");
    }

    private AiServiceCallResult execute(HttpRequest request, String path) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();
            String body = response.body();
            if (statusCode < 200 || statusCode >= 300) {
                String message = "AI service returned HTTP " + statusCode + " for " + path;
                log.warn("{} with body: {}", message, body);
                return new AiServiceCallResult(false, statusCode, MissingNode.getInstance(), message);
            }

            try {
                JsonNode json = objectMapper.readTree(body);
                return new AiServiceCallResult(true, statusCode, json, null);
            } catch (IOException exception) {
                return fail(path, "AI service returned invalid JSON for " + path, exception);
            }
        } catch (HttpTimeoutException exception) {
            return fail(path, "AI service request timed out after " + timeout.toMillis() + " ms", exception);
        } catch (ConnectException exception) {
            return fail(path, "AI service connection was refused", exception);
        } catch (IOException exception) {
            return fail(path, "AI service request failed: " + exception.getMessage(), exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return fail(path, "AI service request was interrupted", exception);
        } catch (RuntimeException exception) {
            return fail(path, "AI service request failed: " + exception.getMessage(), exception);
        }
    }

    private AiServiceCallResult fail(String path, String message, Exception exception) {
        log.warn("AI service call to {} failed: {}", path, message, exception);
        return new AiServiceCallResult(false, 503, MissingNode.getInstance(), message);
    }

    private String normalizeBaseUrl(String configuredBaseUrl) {
        if (configuredBaseUrl == null || configuredBaseUrl.isBlank()) {
            return "http://localhost:8000";
        }
        return configuredBaseUrl.endsWith("/")
                ? configuredBaseUrl.substring(0, configuredBaseUrl.length() - 1)
                : configuredBaseUrl;
    }

    public record AiServiceCallResult(
            boolean success,
            int statusCode,
            JsonNode body,
            String errorMessage) {
    }
}
