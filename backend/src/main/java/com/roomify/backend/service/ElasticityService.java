package com.roomify.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.dto.ai.ElasticityForecastResponse;
import com.roomify.backend.dto.ai.ElasticityRoomContextRequest;
import com.roomify.backend.dto.ai.ElasticitySimulationPointResponse;
import com.roomify.backend.dto.ai.ElasticitySimulationRequest;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.entity.AiPriceRecommendation;
import com.roomify.backend.entity.PriceElasticityForecast;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.AiPriceRecommendationRepository;
import com.roomify.backend.repository.PriceElasticityForecastRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ElasticityService {

    private static final String FASTAPI_SOURCE = "FASTAPI_ELASTICITY_MODEL";
    private static final String FALLBACK_SOURCE = "SPRING_ELASTICITY_FALLBACK";
    private static final int DEFAULT_FORECAST_DAYS = 30;
    private static final List<BigDecimal> PRICE_DELTAS = List.of(
            new BigDecimal("-0.20"),
            new BigDecimal("-0.15"),
            new BigDecimal("-0.10"),
            new BigDecimal("-0.05"),
            BigDecimal.ZERO,
            new BigDecimal("0.05"),
            new BigDecimal("0.10"),
            new BigDecimal("0.15"),
            new BigDecimal("0.20"));

    private final FinanceAnalyticsService financeAnalyticsService;
    private final AiFinanceClient aiFinanceClient;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final PriceElasticityForecastRepository priceElasticityForecastRepository;
    private final AiPriceRecommendationRepository aiPriceRecommendationRepository;
    private final ObjectMapper objectMapper;

    public ElasticityService(
            FinanceAnalyticsService financeAnalyticsService,
            AiFinanceClient aiFinanceClient,
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            PriceElasticityForecastRepository priceElasticityForecastRepository,
            AiPriceRecommendationRepository aiPriceRecommendationRepository,
            ObjectMapper objectMapper) {
        this.financeAnalyticsService = financeAnalyticsService;
        this.aiFinanceClient = aiFinanceClient;
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.priceElasticityForecastRepository = priceElasticityForecastRepository;
        this.aiPriceRecommendationRepository = aiPriceRecommendationRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<ElasticityForecastResponse> getElasticityForecasts() {
        return fetchElasticityForecasts(null, true);
    }

    @Transactional(readOnly = true)
    public List<ElasticityForecastResponse> previewElasticityForecasts() {
        return fetchElasticityForecasts(null, false);
    }

    @Transactional
    public ElasticityForecastResponse getElasticityForecastForRoomType(Long roomTypeId) {
        return fetchElasticityForecasts(roomTypeId, true).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Elasticity forecast not found for room type " + roomTypeId));
    }

    @Transactional(readOnly = true)
    public ElasticityForecastResponse previewElasticityForecastForRoomType(Long roomTypeId) {
        return fetchElasticityForecasts(roomTypeId, false).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Elasticity forecast not found for room type " + roomTypeId));
    }

    private List<ElasticityForecastResponse> fetchElasticityForecasts(Long roomTypeId, boolean persist) {
        List<ElasticityRoomContextRequest> roomContexts = buildRoomContexts(roomTypeId);
        if (roomContexts.isEmpty()) {
            return List.of();
        }

        LocalDate anchorDate = resolveAnchorDate();
        List<ElasticityForecastResponse> responses = resolveAiSimulation(roomContexts, anchorDate);
        if (persist) {
            persistForecasts(responses);
        }
        return responses;
    }

    private List<ElasticityForecastResponse> resolveAiSimulation(
            List<ElasticityRoomContextRequest> roomContexts,
            LocalDate anchorDate) {
        ElasticitySimulationRequest request = new ElasticitySimulationRequest(anchorDate, DEFAULT_FORECAST_DAYS, roomContexts);
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.simulateElasticity(request);
        if (result.success()) {
            List<AiElasticityForecastPayload> payloads = objectMapper.convertValue(
                    result.body(),
                    new TypeReference<List<AiElasticityForecastPayload>>() { });
            return payloads.stream()
                    .map(payload -> toResponse(payload, FASTAPI_SOURCE, false))
                    .toList();
        }

        return buildFallbackForecasts(roomContexts, anchorDate);
    }

    private List<ElasticityRoomContextRequest> buildRoomContexts(Long roomTypeId) {
        FinanceAnalyticsService.DateRange datasetRange = financeAnalyticsService.getDatasetRange();
        LocalDate end = datasetRange.end();
        LocalDate start = end.minusDays(44);
        List<TrainingDataRow> trainingRows = financeAnalyticsService.getTrainingData(start, end);
        Map<Long, List<TrainingDataRow>> rowsByRoomType = trainingRows.stream()
                .collect(Collectors.groupingBy(TrainingDataRow::roomTypeId));

        List<RoomType> roomTypes = roomTypeId == null
                ? roomTypeRepository.findAll().stream().sorted(Comparator.comparing(RoomType::getName)).toList()
                : List.of(roomTypeRepository.findById(roomTypeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Room type not found: " + roomTypeId)));

        return roomTypes.stream()
                .map(roomType -> buildRoomContext(roomType, rowsByRoomType.get(roomType.getId())))
                .toList();
    }

    private ElasticityRoomContextRequest buildRoomContext(RoomType roomType, List<TrainingDataRow> rows) {
        List<TrainingDataRow> safeRows = rows == null ? List.of() : rows.stream()
                .sorted(Comparator.comparing(TrainingDataRow::date))
                .toList();
        TrainingDataRow latest = safeRows.isEmpty() ? null : safeRows.getLast();
        List<TrainingDataRow> trailing = safeRows.isEmpty()
                ? List.of()
                : safeRows.subList(Math.max(0, safeRows.size() - 14), safeRows.size());

        BigDecimal currentPrice = trailing.stream()
                .map(TrainingDataRow::averageRoomPrice)
                .filter(Objects::nonNull)
                .filter(price -> price.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (!trailing.isEmpty() && currentPrice.compareTo(BigDecimal.ZERO) > 0) {
            currentPrice = currentPrice.divide(BigDecimal.valueOf(trailing.size()), 2, RoundingMode.HALF_UP);
        } else {
            currentPrice = Optional.ofNullable(roomType.getBasePrice())
                    .orElse(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        double currentOccupancy = latest != null ? latest.occupancyRate() : 58.0;
        long currentBookings = trailing.isEmpty()
                ? 0L
                : Math.round(trailing.stream().mapToLong(TrainingDataRow::confirmedBookings).average().orElse(0));
        long cancellations = trailing.isEmpty()
                ? 0L
                : Math.round(trailing.stream().mapToLong(TrainingDataRow::cancelledBookings).average().orElse(0));
        BigDecimal averageDailyExpenses = trailing.stream()
                .map(TrainingDataRow::dailyExpenses)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (!trailing.isEmpty() && averageDailyExpenses.compareTo(BigDecimal.ZERO) > 0) {
            averageDailyExpenses = averageDailyExpenses.divide(BigDecimal.valueOf(trailing.size()), 2, RoundingMode.HALF_UP);
        } else {
            averageDailyExpenses = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        long totalRooms = latest != null
                ? latest.totalRooms()
                : roomRepository.findAll().stream()
                        .filter(room -> room.getRoomType() != null && Objects.equals(room.getRoomType().getId(), roomType.getId()))
                        .count();

        return new ElasticityRoomContextRequest(
                roomType.getId(),
                roomType.getName(),
                currentPrice,
                Math.max(totalRooms, 1L),
                currentOccupancy,
                Math.max(currentBookings, 0L),
                Math.max(cancellations, 0L),
                averageDailyExpenses);
    }

    private LocalDate resolveAnchorDate() {
        LocalDate datasetEnd = financeAnalyticsService.getDatasetRange().end().plusDays(1);
        return LocalDate.now().isAfter(datasetEnd) ? LocalDate.now() : datasetEnd;
    }

    private List<ElasticityForecastResponse> buildFallbackForecasts(
            List<ElasticityRoomContextRequest> roomContexts,
            LocalDate anchorDate) {
        double seasonalityFactor = seasonalityFactor(anchorDate.getMonthValue());
        List<ElasticityForecastResponse> responses = new ArrayList<>();
        for (ElasticityRoomContextRequest roomContext : roomContexts) {
            double sensitivity = roomTypeSensitivity(roomContext.roomType());
            double cancellationPenalty = roomContext.currentBookings() <= 0
                    ? 0.0
                    : Math.min(8.0, (roomContext.cancellations() * 100.0) / roomContext.currentBookings());
            List<ElasticitySimulationPointResponse> simulations = new ArrayList<>();
            for (BigDecimal delta : PRICE_DELTAS) {
                BigDecimal price = roomContext.currentPrice()
                        .multiply(BigDecimal.ONE.add(delta))
                        .setScale(2, RoundingMode.HALF_UP);
                double occupancy = clampPercent(
                        roomContext.currentOccupancy()
                                + (seasonalityFactor * 5.0)
                                - cancellationPenalty
                                - (delta.doubleValue() * sensitivity * 38.0));
                int expectedBookings = (int) Math.round((roomContext.totalRooms() * (occupancy / 100.0)) * DEFAULT_FORECAST_DAYS);
                BigDecimal expectedRevenue = price
                        .multiply(BigDecimal.valueOf(expectedBookings))
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal expectedProfit = expectedRevenue.subtract(
                        roomContext.averageDailyExpenses().multiply(BigDecimal.valueOf(DEFAULT_FORECAST_DAYS)))
                        .setScale(2, RoundingMode.HALF_UP);
                simulations.add(new ElasticitySimulationPointResponse(
                        price,
                        round(occupancy),
                        Math.max(expectedBookings, 0),
                        expectedRevenue,
                        expectedProfit,
                        round(delta.doubleValue() * 100.0),
                        false));
            }

            ElasticitySimulationPointResponse optimal = simulations.stream()
                    .max(Comparator.comparing(ElasticitySimulationPointResponse::profit)
                            .thenComparing(ElasticitySimulationPointResponse::revenue))
                    .orElseThrow();
            List<ElasticitySimulationPointResponse> markedSimulations = simulations.stream()
                    .map(simulation -> new ElasticitySimulationPointResponse(
                            simulation.price(),
                            simulation.occupancy(),
                            simulation.expectedBookings(),
                            simulation.revenue(),
                            simulation.profit(),
                            simulation.deltaPercentage(),
                            simulation.price().compareTo(optimal.price()) == 0))
                    .toList();

            responses.add(new ElasticityForecastResponse(
                    roomContext.roomTypeId(),
                    roomContext.roomType(),
                    roomContext.currentPrice(),
                    optimal.price(),
                    optimal.occupancy(),
                    optimal.expectedBookings(),
                    optimal.revenue(),
                    optimal.profit(),
                    0.63,
                    DEFAULT_FORECAST_DAYS,
                    "SpringHeuristicFallback",
                    FALLBACK_SOURCE,
                    true,
                    markedSimulations));
        }

        return responses;
    }

    private void persistForecasts(List<ElasticityForecastResponse> responses) {
        Map<Long, RoomType> roomTypeMap = roomTypeRepository.findAllById(
                        responses.stream().map(ElasticityForecastResponse::roomTypeId).toList())
                .stream()
                .collect(Collectors.toMap(RoomType::getId, Function.identity()));

        LocalDateTime generatedAt = LocalDateTime.now();
        List<PriceElasticityForecast> forecastRows = new ArrayList<>();
        List<AiPriceRecommendation> recommendationRows = new ArrayList<>();

        for (ElasticityForecastResponse response : responses) {
            RoomType roomType = roomTypeMap.get(response.roomTypeId());
            if (roomType == null) {
                continue;
            }

            for (ElasticitySimulationPointResponse simulation : response.priceSimulations()) {
                PriceElasticityForecast forecast = new PriceElasticityForecast();
                forecast.setGeneratedAt(generatedAt);
                forecast.setRoomType(roomType);
                forecast.setCurrentPrice(response.currentPrice());
                forecast.setSuggestedPrice(simulation.price());
                forecast.setPriceDeltaPercentage(BigDecimal.valueOf(simulation.deltaPercentage()).setScale(2, RoundingMode.HALF_UP));
                forecast.setExpectedOccupancy(BigDecimal.valueOf(simulation.occupancy()).setScale(2, RoundingMode.HALF_UP));
                forecast.setExpectedBookings(simulation.expectedBookings());
                forecast.setExpectedRevenue(simulation.revenue());
                forecast.setExpectedProfit(simulation.profit());
                forecast.setConfidenceScore(BigDecimal.valueOf(response.confidenceScore()).setScale(2, RoundingMode.HALF_UP));
                forecast.setRecommended(simulation.recommended());
                forecast.setSource(response.source());
                forecastRows.add(forecast);
            }

            AiPriceRecommendation recommendation = new AiPriceRecommendation();
            recommendation.setGeneratedAt(generatedAt);
            recommendation.setRoomType(roomType);
            recommendation.setCurrentPrice(response.currentPrice());
            recommendation.setSuggestedPrice(response.optimalPrice());
            recommendation.setExpectedOccupancy(BigDecimal.valueOf(response.expectedOccupancy()).setScale(2, RoundingMode.HALF_UP));
            recommendation.setExpectedBookings(response.expectedBookings());
            recommendation.setExpectedRevenue(response.expectedRevenue());
            recommendation.setExpectedProfit(response.expectedProfit());
            recommendation.setConfidenceScore(BigDecimal.valueOf(response.confidenceScore()).setScale(2, RoundingMode.HALF_UP));
            recommendation.setSource(response.source());
            recommendationRows.add(recommendation);
        }

        if (!forecastRows.isEmpty()) {
            priceElasticityForecastRepository.saveAll(forecastRows);
        }
        if (!recommendationRows.isEmpty()) {
            aiPriceRecommendationRepository.saveAll(recommendationRows);
        }
    }

    private ElasticityForecastResponse toResponse(
            AiElasticityForecastPayload payload,
            String source,
            boolean fallbackUsed) {
        return new ElasticityForecastResponse(
                payload.roomTypeId(),
                payload.roomType(),
                money(payload.currentPrice()),
                money(payload.optimalPrice()),
                round(payload.expectedOccupancy()),
                payload.expectedBookings(),
                money(payload.expectedRevenue()),
                money(payload.expectedProfit()),
                round(payload.confidenceScore()),
                payload.forecastDays(),
                payload.modelType(),
                source,
                fallbackUsed,
                payload.priceSimulations().stream()
                        .map(point -> new ElasticitySimulationPointResponse(
                                money(point.price()),
                                round(point.occupancy()),
                                point.expectedBookings(),
                                money(point.revenue()),
                                money(point.profit()),
                                round(point.deltaPercentage()),
                                point.recommended()))
                        .toList());
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private double clampPercent(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double roomTypeSensitivity(String roomType) {
        String normalized = roomType == null ? "" : roomType.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "standard" -> 1.05;
            case "deluxe" -> 0.92;
            case "family" -> 0.82;
            case "executive" -> 0.76;
            case "suite" -> 0.68;
            default -> 0.88;
        };
    }

    private double seasonalityFactor(int month) {
        return switch (month) {
            case 12, 1, 2 -> 0.9;
            case 7, 8 -> 1.1;
            case 6, 9 -> -0.35;
            case 10, 11 -> 0.45;
            default -> 0.2;
        };
    }

    private record AiElasticityForecastPayload(
            Long roomTypeId,
            String roomType,
            BigDecimal currentPrice,
            BigDecimal optimalPrice,
            double expectedOccupancy,
            int expectedBookings,
            BigDecimal expectedRevenue,
            BigDecimal expectedProfit,
            double confidenceScore,
            int forecastDays,
            String modelType,
            List<AiElasticitySimulationPointPayload> priceSimulations) {
    }

    private record AiElasticitySimulationPointPayload(
            BigDecimal price,
            double occupancy,
            int expectedBookings,
            BigDecimal revenue,
            BigDecimal profit,
            double deltaPercentage,
            boolean recommended) {
    }
}
