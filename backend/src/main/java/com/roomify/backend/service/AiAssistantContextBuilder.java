package com.roomify.backend.service;

import com.roomify.backend.dto.ai.AiFinanceSummaryResponse;
import com.roomify.backend.dto.ai.DemandHeatmapPointResponse;
import com.roomify.backend.dto.ai.ElasticityForecastResponse;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.repository.ReservationRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class AiAssistantContextBuilder {

    private final FinanceAnalyticsService financeAnalyticsService;
    private final ReservationRepository reservationRepository;
    private final ElasticityService elasticityService;
    private final DemandHeatmapService demandHeatmapService;

    public AiAssistantContextBuilder(
            FinanceAnalyticsService financeAnalyticsService,
            ReservationRepository reservationRepository,
            ElasticityService elasticityService,
            DemandHeatmapService demandHeatmapService) {
        this.financeAnalyticsService = financeAnalyticsService;
        this.reservationRepository = reservationRepository;
        this.elasticityService = elasticityService;
        this.demandHeatmapService = demandHeatmapService;
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
        BigDecimal projectedNextMonthRevenue = projectNextMonthRevenue(trainingData);
        DemandHeatmapPointResponse peakDemandDay = currentMonthHeatmap.stream()
                .max(Comparator.comparingInt(DemandHeatmapPointResponse::demandScore))
                .orElse(null);

        String summaryText = buildSummaryText(summary, bestRoomType, bestOccupancyMonth, cancellationInsight, projectedNextMonthRevenue, peakDemandDay);
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
                projectedNextMonthRevenue,
                peakDemandDay,
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

    private BigDecimal projectNextMonthRevenue(List<TrainingDataRow> trainingData) {
        if (trainingData.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        LocalDate lastDate = trainingData.stream().map(TrainingDataRow::date).max(LocalDate::compareTo).orElse(LocalDate.now());
        LocalDate start = lastDate.minusDays(29);
        BigDecimal trailingRevenue = trainingData.stream()
                .filter(row -> !row.date().isBefore(start))
                .map(TrainingDataRow::dailyRevenue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageDailyRevenue = trailingRevenue.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        int nextMonth = lastDate.plusMonths(1).getMonthValue();
        BigDecimal seasonalFactor = switch (nextMonth) {
            case 12, 1, 2 -> new BigDecimal("1.12");
            case 7, 8 -> new BigDecimal("1.18");
            case 6, 9 -> new BigDecimal("0.94");
            case 10, 11 -> new BigDecimal("1.05");
            default -> new BigDecimal("1.00");
        };
        int daysInNextMonth = YearMonth.from(lastDate.plusMonths(1)).lengthOfMonth();
        return averageDailyRevenue
                .multiply(BigDecimal.valueOf(daysInNextMonth))
                .multiply(seasonalFactor)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String buildSummaryText(
            AiFinanceSummaryResponse summary,
            RoomTypeRevenueResponse bestRoomType,
            MonthPerformance bestOccupancyMonth,
            CancellationInsight cancellationInsight,
            BigDecimal projectedNextMonthRevenue,
            DemandHeatmapPointResponse peakDemandDay) {
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
        builder.append("Projected next month revenue: SAR ")
                .append(projectedNextMonthRevenue.toPlainString())
                .append(". ");
        if (peakDemandDay != null) {
            builder.append("Peak demand day this month: ")
                    .append(peakDemandDay.date())
                    .append(" with score ")
                    .append(peakDemandDay.demandScore())
                    .append('.');
        }
        return builder.toString();
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
            BigDecimal projectedNextMonthRevenue,
            DemandHeatmapPointResponse peakDemandDay,
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
}
