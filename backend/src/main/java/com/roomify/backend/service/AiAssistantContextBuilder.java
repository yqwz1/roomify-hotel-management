package com.roomify.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.roomify.backend.dto.ai.AiFinanceSummaryResponse;
import com.roomify.backend.dto.ai.DemandHeatmapPointResponse;
import com.roomify.backend.dto.ai.ElasticityForecastResponse;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.ServiceCharge;
import com.roomify.backend.entity.ServiceRequest;
import com.roomify.backend.entity.ServiceRequestStatus;
import com.roomify.backend.entity.ServiceUsageRecord;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.ServiceChargeRepository;
import com.roomify.backend.repository.ServiceRequestRepository;
import com.roomify.backend.repository.ServiceUsageRecordRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class AiAssistantContextBuilder {

    private final FinanceAnalyticsService financeAnalyticsService;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final GuestRepository guestRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceChargeRepository serviceChargeRepository;
    private final ServiceUsageRecordRepository serviceUsageRecordRepository;
    private final ElasticityService elasticityService;
    private final DemandHeatmapService demandHeatmapService;
    private final AiFinanceClient aiFinanceClient;

    public AiAssistantContextBuilder(
            FinanceAnalyticsService financeAnalyticsService,
            ReservationRepository reservationRepository,
            RoomRepository roomRepository,
            PaymentRepository paymentRepository,
            ExpenseRepository expenseRepository,
            GuestRepository guestRepository,
            ServiceRequestRepository serviceRequestRepository,
            ServiceChargeRepository serviceChargeRepository,
            ServiceUsageRecordRepository serviceUsageRecordRepository,
            ElasticityService elasticityService,
            DemandHeatmapService demandHeatmapService,
            AiFinanceClient aiFinanceClient) {
        this.financeAnalyticsService = financeAnalyticsService;
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.guestRepository = guestRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceChargeRepository = serviceChargeRepository;
        this.serviceUsageRecordRepository = serviceUsageRecordRepository;
        this.elasticityService = elasticityService;
        this.demandHeatmapService = demandHeatmapService;
        this.aiFinanceClient = aiFinanceClient;
    }

    public AiAssistantContext buildContext() {
        AiFinanceSummaryResponse summary = financeAnalyticsService.getFinanceSummary();
        FinanceAnalyticsService.DateRange datasetRange = financeAnalyticsService.getDatasetRange();
        List<TrainingDataRow> trainingData = financeAnalyticsService.getTrainingData(datasetRange.start(), datasetRange.end());
        List<RoomTypeRevenueResponse> roomTypeRevenue = financeAnalyticsService.getRoomTypeRevenue();
        List<ElasticityForecastResponse> elasticityForecasts = elasticityService.previewElasticityForecasts();
        List<DemandHeatmapPointResponse> currentMonthHeatmap = demandHeatmapService.getDemandHeatmap(null, null);
        List<Reservation> reservations = reservationRepository.findAllWithDetails();

        RoomTypeRevenueResponse bestRoomType = roomTypeRevenue.stream()
                .max(Comparator.comparing(RoomTypeRevenueResponse::revenue))
                .orElse(null);
        MonthPerformance bestOccupancyMonth = resolveBestOccupancyMonth(trainingData);
        CancellationInsight cancellationInsight = resolveCancellationInsight(reservations);
        FastApiRevenueForecast fastApiRevenueForecast = resolveFastApiRevenueForecast();
        List<FastApiPricingRecommendation> fastApiPricingRecommendations = resolveFastApiPricingRecommendations();
        DemandHeatmapPointResponse peakDemandDay = currentMonthHeatmap.stream()
                .max(Comparator.comparingInt(DemandHeatmapPointResponse::demandScore))
                .orElse(null);
        RoomifyDataSnapshot snapshot = buildSnapshot(
                summary,
                roomTypeRevenue,
                currentMonthHeatmap,
                reservations,
                fastApiRevenueForecast,
                fastApiPricingRecommendations);

        String summaryText = buildSummaryText(summary, bestRoomType, bestOccupancyMonth, cancellationInsight, fastApiRevenueForecast, peakDemandDay, snapshot);
        List<String> suggestedPrompts = List.of(
                "Why did revenue drop this week?",
                "Which room type performs best?",
                "What price should we use next weekend?",
                "Predict next month revenue");

        return new AiAssistantContext(
                summary,
                roomTypeRevenue,
                elasticityForecasts,
                currentMonthHeatmap,
                bestRoomType,
                bestOccupancyMonth,
                cancellationInsight,
                fastApiRevenueForecast,
                fastApiPricingRecommendations,
                peakDemandDay,
                snapshot,
                summaryText,
                suggestedPrompts);
    }

    private MonthPerformance resolveBestOccupancyMonth(List<TrainingDataRow> trainingData) {
        return trainingData.stream()
                .collect(Collectors.groupingBy(
                        row -> row.date().getMonthValue(),
                        Collectors.averagingDouble(TrainingDataRow::occupancyRate)))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> new MonthPerformance(
                        entry.getKey(),
                        YearMonth.of(LocalDate.now().getYear(), entry.getKey()).getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                        round(entry.getValue())))
                .orElse(new MonthPerformance(0, "Unavailable", 0.0));
    }

    private CancellationInsight resolveCancellationInsight(List<Reservation> reservations) {
        List<Reservation> cancelledReservations = reservations.stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.CANCELLED)
                .toList();
        long totalCancelled = cancelledReservations.size();
        Map<String, Long> groupedReasons = cancelledReservations.stream()
                .collect(Collectors.groupingBy(
                        reservation -> {
                            String reason = reservation.getCancellationReason();
                            return reason == null || reason.isBlank() ? "No reason captured" : reason;
                        },
                        Collectors.counting()));
        Map.Entry<String, Long> topReason = groupedReasons.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(Map.entry("No cancellations recorded", 0L));
        return new CancellationInsight(topReason.getKey(), topReason.getValue(), totalCancelled);
    }

    private String buildSummaryText(
            AiFinanceSummaryResponse summary,
            RoomTypeRevenueResponse bestRoomType,
            MonthPerformance bestOccupancyMonth,
            CancellationInsight cancellationInsight,
            FastApiRevenueForecast fastApiRevenueForecast,
            DemandHeatmapPointResponse peakDemandDay,
            RoomifyDataSnapshot snapshot) {
        StringBuilder builder = new StringBuilder();
        builder.append("Weekly revenue: SAR ")
                .append(summary.thisWeekRevenue().setScale(2, RoundingMode.HALF_UP).toPlainString())
                .append(" (change ")
                .append(round(summary.revenueChangePercentage()))
                .append("%). ");
        builder.append("Current occupancy is ")
                .append(round(summary.currentOccupancy()))
                .append("%. ");
        if (bestRoomType != null) {
            builder.append("Best room type: ")
                    .append(bestRoomType.roomType())
                    .append(" at SAR ")
                    .append(bestRoomType.revenue().setScale(2, RoundingMode.HALF_UP).toPlainString())
                    .append(". ");
        }
        builder.append("Highest occupancy month: ")
                .append(bestOccupancyMonth.monthName())
                .append(" at ")
                .append(bestOccupancyMonth.averageOccupancy())
                .append("%. ");
        builder.append("Top cancellation cause: ")
                .append(cancellationInsight.reason())
                .append(" (")
                .append(cancellationInsight.count())
                .append(" of ")
                .append(cancellationInsight.totalCancelled())
                .append(" cancellations). ");
        if (fastApiRevenueForecast != null) {
            builder.append("Authoritative revenue forecast source: ")
                    .append(fastApiRevenueForecast.source())
                    .append(", predicted revenue total SAR ")
                    .append(money(fastApiRevenueForecast.predictedRevenueTotal()))
                    .append(" over ")
                    .append(fastApiRevenueForecast.forecastDays())
                    .append(" days, predicted average occupancy ")
                    .append(round(fastApiRevenueForecast.predictedAverageOccupancy()))
                    .append("%. ");
        } else {
            builder.append("FastAPI forecast is unavailable. ");
        }
        if (peakDemandDay != null) {
            builder.append("Peak demand day this month: ")
                    .append(peakDemandDay.date())
                    .append(" with score ")
                    .append(peakDemandDay.demandScore())
                    .append('.');
        }
        if (snapshot != null && snapshot.hotelOverview() != null) {
            builder.append(" Snapshot source: ROOMIFY_DB at ")
                    .append(snapshot.generatedAt())
                    .append("; rooms ")
                    .append(snapshot.hotelOverview().totalRooms())
                    .append(", active reservations ")
                    .append(snapshot.hotelOverview().activeReservations())
                    .append(", guests ")
                    .append(snapshot.hotelOverview().guestCount())
                    .append('.');
        }
        return builder.toString();
    }

    private RoomifyDataSnapshot buildSnapshot(
            AiFinanceSummaryResponse summary,
            List<RoomTypeRevenueResponse> roomTypeRevenue,
            List<DemandHeatmapPointResponse> demandHeatmap,
            List<Reservation> reservations,
            FastApiRevenueForecast fastApiRevenueForecast,
            List<FastApiPricingRecommendation> pricingRecommendations) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        LocalDate previousWeekStart = today.minusDays(13);
        LocalDate previousWeekEnd = today.minusDays(7);
        LocalDate monthStart = today.withDayOfMonth(1);

        List<Room> rooms = roomRepository.findAllWithRoomTypeOrderByRoomNumber();
        long totalRooms = rooms.size();
        long availableRooms = rooms.stream().filter(room -> room.getStatus() == RoomStatus.AVAILABLE).count();
        long occupiedRooms = rooms.stream().filter(room -> room.getStatus() == RoomStatus.OCCUPIED).count();
        double occupancyRate = totalRooms == 0 ? 0.0 : round((occupiedRooms * 100.0) / totalRooms);
        long activeReservations = reservations.stream().filter(this::isActiveReservation).count();
        long checkInsToday = reservations.stream().filter(reservation -> today.equals(reservation.getCheckInDate())).count();
        long checkOutsToday = reservations.stream().filter(reservation -> today.equals(reservation.getCheckOutDate())).count();
        HotelOverview overview = new HotelOverview(
                totalRooms,
                availableRooms,
                occupiedRooms,
                occupancyRate,
                activeReservations,
                checkInsToday,
                checkOutsToday,
                guestRepository.count(),
                "ROOMIFY_DB",
                today.toString());

        BigDecimal currentMonthRevenue = reservations.stream()
                .filter(reservation -> reservation.getCreatedAt() != null)
                .filter(reservation -> !reservation.getCreatedAt().toLocalDate().isBefore(monthStart))
                .map(Reservation::getTotalPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Payment> payments = paymentRepository.findAllByOrderByCreatedAtDesc();
        BigDecimal paymentsReceived = payments.stream()
                .filter(payment -> payment.getPaymentStatus() == PaymentStatus.PAID)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingPayments = payments.stream()
                .filter(payment -> payment.getPaymentStatus() != PaymentStatus.PAID && payment.getPaymentStatus() != PaymentStatus.REFUNDED)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal currentWeekExpenses = expenseRepository.sumAmountInPeriod(weekStart, today);
        BigDecimal previousWeekExpenses = expenseRepository.sumAmountInPeriod(previousWeekStart, previousWeekEnd);
        FinanceSnapshot finance = new FinanceSnapshot(
                moneyValue(summary.thisWeekRevenue()),
                moneyValue(summary.lastWeekRevenue()),
                round(summary.revenueChangePercentage()),
                moneyValue(currentMonthRevenue),
                moneyValue(paymentsReceived),
                moneyValue(pendingPayments),
                moneyValue(currentWeekExpenses),
                moneyValue(previousWeekExpenses),
                moneyValue(summary.netProfit()),
                "ROOMIFY_DB",
                weekStart + " to " + today);

        long totalReservations = reservations.size();
        long confirmedReservations = countReservations(reservations, ReservationStatus.CONFIRMED);
        long pendingReservations = reservations.stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.PENDING
                        || reservation.getStatus() == ReservationStatus.PAYMENT_PENDING)
                .count();
        long cancelledReservations = countReservations(reservations, ReservationStatus.CANCELLED);
        ReservationSnapshot reservationSnapshot = new ReservationSnapshot(
                totalReservations,
                activeReservations,
                confirmedReservations,
                pendingReservations,
                cancelledReservations,
                totalReservations == 0 ? 0.0 : round((cancelledReservations * 100.0) / totalReservations),
                "ROOMIFY_DB",
                "all reservations");

        List<RoomTypePerformance> roomTypes = roomTypeRevenue.stream()
                .filter(Objects::nonNull)
                .map(roomType -> new RoomTypePerformance(
                        roomType.roomType(),
                        roomType.reservations(),
                        moneyValue(roomType.revenue()),
                        null,
                        moneyValue(roomType.averagePrice()),
                        "ROOMIFY_DB"))
                .toList();
        RoomTypePerformance best = roomTypes.stream()
                .max(Comparator.comparing(RoomTypePerformance::revenue))
                .orElse(null);
        RoomTypePerformance weakest = roomTypes.stream()
                .min(Comparator.comparing(RoomTypePerformance::revenue))
                .orElse(null);
        RoomPerformanceSnapshot roomPerformance = new RoomPerformanceSnapshot(roomTypes, best, weakest, "ROOMIFY_DB");

        List<ServiceRequest> serviceRequests = serviceRequestRepository.findAllByOrderByCreatedAtDesc();
        Map<String, Long> topServiceTypes = serviceRequests.stream()
                .collect(Collectors.groupingBy(
                        request -> request.getServiceType() == null ? "UNKNOWN" : request.getServiceType().name(),
                        Collectors.counting()));
        List<ServiceMetric> topServices = topServiceTypes.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new ServiceMetric(entry.getKey(), entry.getValue()))
                .toList();
        BigDecimal serviceRevenue = serviceChargeRepository.findAll().stream()
                .map(ServiceCharge::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<ServiceUsageRecord> usageRecords = serviceUsageRecordRepository.findByServiceDateBetweenOrderByPerformedAtDescIdDesc(monthStart, today);
        BigDecimal serviceUsageCost = usageRecords.stream()
                .map(ServiceUsageRecord::getTotalCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        ServicesSnapshot services = new ServicesSnapshot(
                topServices,
                moneyValue(serviceRevenue),
                serviceRequests.stream().filter(request -> request.getStatus() == ServiceRequestStatus.PENDING).count(),
                serviceRequests.stream().filter(request -> request.getStatus() == ServiceRequestStatus.IN_PROGRESS).count(),
                serviceRequests.stream().filter(request -> request.getStatus() == ServiceRequestStatus.COMPLETED).count(),
                moneyValue(serviceUsageCost),
                "ROOMIFY_DB",
                monthStart + " to " + today);

        FastApiSnapshot fastApi = new FastApiSnapshot(
                fastApiRevenueForecast,
                pricingRecommendations,
                buildPricingSummary(pricingRecommendations),
                demandHeatmap.stream()
                        .filter(Objects::nonNull)
                        .sorted((left, right) -> Integer.compare(right.demandScore(), left.demandScore()))
                        .limit(3)
                        .toList(),
                "FASTAPI_MODEL");

        return new RoomifyDataSnapshot(
                LocalDateTime.now(),
                overview,
                finance,
                reservationSnapshot,
                roomPerformance,
                services,
                fastApi);
    }

    private boolean isActiveReservation(Reservation reservation) {
        return reservation.getStatus() == ReservationStatus.PENDING
                || reservation.getStatus() == ReservationStatus.PAYMENT_PENDING
                || reservation.getStatus() == ReservationStatus.CONFIRMED
                || reservation.getStatus() == ReservationStatus.CHECKED_IN;
    }

    private long countReservations(List<Reservation> reservations, ReservationStatus status) {
        return reservations.stream().filter(reservation -> reservation.getStatus() == status).count();
    }

    private FastApiRevenueForecast resolveFastApiRevenueForecast() {
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.getRevenueForecast();
        if (!result.success()) {
            return null;
        }

        JsonNode body = result.body();
        JsonNode revenueNode = body.path("predictedRevenueTotal");
        JsonNode occupancyNode = body.path("predictedAverageOccupancy");
        if (revenueNode.isMissingNode() || revenueNode.isNull()
                || occupancyNode.isMissingNode() || occupancyNode.isNull()) {
            return null;
        }

        return new FastApiRevenueForecast(
                revenueNode.decimalValue().setScale(2, RoundingMode.HALF_UP),
                occupancyNode.asDouble(),
                body.path("forecastDays").asInt(30),
                "FASTAPI_MODEL");
    }

    private List<FastApiPricingRecommendation> resolveFastApiPricingRecommendations() {
        AiFinanceClient.AiServiceCallResult result = aiFinanceClient.getPricingRecommendations();
        if (!result.success() || result.body() == null) {
            return List.of();
        }
        JsonNode body = result.body();
        JsonNode recommendations = body.isArray() ? body : body.path("pricingRecommendations");
        if (!recommendations.isArray()) {
            return List.of();
        }
        List<FastApiPricingRecommendation> values = new ArrayList<>();
        for (JsonNode recommendation : recommendations) {
            String roomType = text(recommendation, "roomType");
            if (roomType.isBlank()) {
                roomType = text(recommendation, "roomTypeName");
            }
            if (roomType.isBlank()) {
                continue;
            }
            BigDecimal currentPrice = decimal(recommendation, "currentPrice");
            BigDecimal suggestedPrice = decimal(recommendation, "suggestedPrice");
            double adjustmentPercent = recommendation.path("adjustmentPercent").asDouble(0.0);
            String direction = suggestedPrice.compareTo(currentPrice) >= 0 ? "increase" : "decrease";
            values.add(new FastApiPricingRecommendation(
                    roomType,
                    currentPrice,
                    suggestedPrice,
                    round(adjustmentPercent),
                    direction,
                    text(recommendation, "riskLevel"),
                    text(recommendation, "reason"),
                    "FASTAPI_MODEL"));
        }
        return values;
    }

    private PricingSummary buildPricingSummary(List<FastApiPricingRecommendation> recommendations) {
        if (recommendations == null || recommendations.isEmpty()) {
            return new PricingSummary(0, null, 0.0, "FASTAPI_MODEL");
        }
        FastApiPricingRecommendation strongest = recommendations.stream()
                .max(Comparator.comparingDouble(recommendation -> Math.abs(recommendation.adjustmentPercent())))
                .orElse(null);
        return new PricingSummary(
                recommendations.size(),
                strongest == null ? null : strongest.roomTypeName(),
                strongest == null ? 0.0 : Math.abs(strongest.adjustmentPercent()),
                "FASTAPI_MODEL");
    }

    private String text(JsonNode node, String field) {
        String value = node.path(field).asText("");
        return value == null ? "" : value.trim();
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull() || !value.isNumber()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.decimalValue().setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal moneyValue(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String money(BigDecimal value) {
        return value == null
                ? "0.00"
                : String.format(Locale.US, "%,.2f", value.setScale(2, RoundingMode.HALF_UP));
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    public record AiAssistantContext(
            AiFinanceSummaryResponse summary,
            List<RoomTypeRevenueResponse> roomTypeRevenue,
            List<ElasticityForecastResponse> elasticityForecasts,
            List<DemandHeatmapPointResponse> demandHeatmap,
            RoomTypeRevenueResponse bestRoomType,
            MonthPerformance bestOccupancyMonth,
            CancellationInsight cancellationInsight,
            FastApiRevenueForecast fastApiRevenueForecast,
            List<FastApiPricingRecommendation> fastApiPricingRecommendations,
            DemandHeatmapPointResponse peakDemandDay,
            RoomifyDataSnapshot snapshot,
            String summaryText,
            List<String> suggestedPrompts) {
    }

    public record MonthPerformance(
            int monthNumber,
            String monthName,
            double averageOccupancy) {
    }

    public record CancellationInsight(
            String reason,
            long count,
            long totalCancelled) {
    }

    public record FastApiRevenueForecast(
            BigDecimal predictedRevenueTotal,
            double predictedAverageOccupancy,
            int forecastDays,
            String source) {
    }

    public record FastApiPricingRecommendation(
            String roomTypeName,
            BigDecimal currentPrice,
            BigDecimal suggestedPrice,
            double adjustmentPercent,
            String direction,
            String risk,
            String reason,
            String source) {
    }

    public record PricingSummary(
            int recommendationCount,
            String highestAdjustmentRoomType,
            double highestAdjustmentPercent,
            String source) {
    }

    public record RoomifyDataSnapshot(
            LocalDateTime generatedAt,
            HotelOverview hotelOverview,
            FinanceSnapshot finance,
            ReservationSnapshot reservations,
            RoomPerformanceSnapshot roomPerformance,
            ServicesSnapshot services,
            FastApiSnapshot fastApi) {
    }

    public record HotelOverview(
            long totalRooms,
            long availableRooms,
            long occupiedRooms,
            double occupancyRate,
            long activeReservations,
            long checkInsToday,
            long checkOutsToday,
            long guestCount,
            String source,
            String date) {
    }

    public record FinanceSnapshot(
            BigDecimal currentWeekRevenue,
            BigDecimal previousWeekRevenue,
            double revenueChangePercentage,
            BigDecimal currentMonthRevenue,
            BigDecimal paymentsReceived,
            BigDecimal pendingPayments,
            BigDecimal currentWeekExpenses,
            BigDecimal previousWeekExpenses,
            BigDecimal netProfit,
            String source,
            String dateRange) {
    }

    public record ReservationSnapshot(
            long reservationCount,
            long activeReservations,
            long confirmedReservations,
            long pendingReservations,
            long cancelledReservations,
            double cancellationRate,
            String source,
            String dateRange) {
    }

    public record RoomPerformanceSnapshot(
            List<RoomTypePerformance> roomTypes,
            RoomTypePerformance bestPerformingRoomType,
            RoomTypePerformance weakestRoomType,
            String source) {
    }

    public record RoomTypePerformance(
            String roomTypeName,
            long reservations,
            BigDecimal revenue,
            Double occupancyRate,
            BigDecimal averageDailyRate,
            String source) {
    }

    public record ServicesSnapshot(
            List<ServiceMetric> topRequestedServices,
            BigDecimal serviceRevenue,
            long pendingServiceRequests,
            long inProgressServiceRequests,
            long completedServiceRequests,
            BigDecimal serviceUsageCost,
            String source,
            String dateRange) {
    }

    public record ServiceMetric(
            String serviceName,
            long count) {
    }

    public record FastApiSnapshot(
            FastApiRevenueForecast revenueForecast,
            List<FastApiPricingRecommendation> pricingRecommendations,
            PricingSummary pricingSummary,
            List<DemandHeatmapPointResponse> demandHeatmapSummary,
            String source) {
    }
}
