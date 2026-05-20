package com.roomify.backend.service;

import com.roomify.backend.dto.ai.DemandHeatmapPointResponse;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DemandHeatmapService {

    private final FinanceAnalyticsService financeAnalyticsService;
    private final RoomTypeRepository roomTypeRepository;

    public DemandHeatmapService(
            FinanceAnalyticsService financeAnalyticsService,
            RoomTypeRepository roomTypeRepository) {
        this.financeAnalyticsService = financeAnalyticsService;
        this.roomTypeRepository = roomTypeRepository;
    }

    public List<DemandHeatmapPointResponse> getDemandHeatmap(String monthValue, Long roomTypeId) {
        YearMonth yearMonth = resolveMonth(monthValue);
        RoomType roomType = roomTypeId == null
                ? null
                : roomTypeRepository.findById(roomTypeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Room type not found: " + roomTypeId));

        List<TrainingDataRow> trainingRows = financeAnalyticsService.getTrainingData(
                yearMonth.atDay(1),
                yearMonth.atEndOfMonth());
        if (roomType != null) {
            trainingRows = trainingRows.stream()
                    .filter(row -> Objects.equals(row.roomTypeId(), roomType.getId()))
                    .toList();
        }

        Map<LocalDate, HeatmapAggregate> aggregateByDate = new HashMap<>();
        for (TrainingDataRow row : trainingRows) {
            HeatmapAggregate aggregate = aggregateByDate.computeIfAbsent(row.date(), ignored -> new HeatmapAggregate());
            aggregate.revenue = aggregate.revenue.add(row.dailyRevenue());
            aggregate.bookings += row.confirmedBookings();
            aggregate.occupiedRooms += row.occupiedRoomNights();
            aggregate.totalRooms += row.totalRooms();
        }

        BigDecimal maxRevenue = aggregateByDate.values().stream()
                .map(aggregate -> aggregate.revenue)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ONE);
        long maxBookings = aggregateByDate.values().stream()
                .mapToLong(aggregate -> aggregate.bookings)
                .max()
                .orElse(1L);

        List<DemandHeatmapPointResponse> responses = new ArrayList<>();
        for (LocalDate date = yearMonth.atDay(1); !date.isAfter(yearMonth.atEndOfMonth()); date = date.plusDays(1)) {
            HeatmapAggregate aggregate = aggregateByDate.getOrDefault(date, new HeatmapAggregate());
            double occupancy = aggregate.totalRooms > 0
                    ? ((aggregate.occupiedRooms * 100.0) / aggregate.totalRooms)
                    : 0.0;
            BigDecimal revenue = aggregate.revenue.setScale(2, RoundingMode.HALF_UP);
            boolean weekend = isWeekend(date);
            Optional<String> holidayLabel = resolveHoliday(date);
            int demandScore = calculateDemandScore(
                    occupancy,
                    revenue,
                    aggregate.bookings,
                    maxRevenue,
                    maxBookings,
                    weekend,
                    holidayLabel.isPresent(),
                    date.getMonthValue());

            responses.add(new DemandHeatmapPointResponse(
                    date,
                    demandScore,
                    round(occupancy),
                    revenue,
                    aggregate.bookings,
                    weekend,
                    holidayLabel.isPresent(),
                    holidayLabel.orElse(null),
                    roomType != null ? roomType.getId() : null,
                    roomType != null ? roomType.getName() : "All room types"));
        }

        return responses;
    }

    private YearMonth resolveMonth(String monthValue) {
        if (monthValue == null || monthValue.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(monthValue);
        } catch (Exception exception) {
            throw new IllegalArgumentException("month must use the YYYY-MM format");
        }
    }

    private int calculateDemandScore(
            double occupancy,
            BigDecimal revenue,
            long bookings,
            BigDecimal maxRevenue,
            long maxBookings,
            boolean weekend,
            boolean holiday,
            int month) {
        double revenueRatio = maxRevenue.compareTo(BigDecimal.ZERO) > 0
                ? revenue.divide(maxRevenue, 4, RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        double bookingRatio = maxBookings > 0 ? (double) bookings / maxBookings : 0.0;
        double seasonalBoost = switch (month) {
            case 12, 1, 2 -> 7.0;
            case 7, 8 -> 9.0;
            case 10, 11 -> 5.0;
            case 6, 9 -> -4.0;
            default -> 2.0;
        };
        double score = (occupancy * 0.55)
                + (revenueRatio * 22.0)
                + (bookingRatio * 12.0)
                + seasonalBoost
                + (weekend ? 5.0 : 0.0)
                + (holiday ? 8.0 : 0.0);
        return (int) Math.max(0, Math.min(100, Math.round(score)));
    }

    private boolean isWeekend(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case FRIDAY, SATURDAY -> true;
            default -> false;
        };
    }

    private Optional<String> resolveHoliday(LocalDate date) {
        return Optional.ofNullable(SAUDI_HOLIDAYS.get(date));
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static final Map<LocalDate, String> SAUDI_HOLIDAYS = Map.ofEntries(
            Map.entry(LocalDate.of(2025, 2, 22), "Founding Day"),
            Map.entry(LocalDate.of(2025, 3, 30), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2025, 3, 31), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2025, 6, 6), "Eid al-Adha"),
            Map.entry(LocalDate.of(2025, 6, 7), "Eid al-Adha"),
            Map.entry(LocalDate.of(2025, 9, 23), "National Day"),
            Map.entry(LocalDate.of(2026, 2, 22), "Founding Day"),
            Map.entry(LocalDate.of(2026, 3, 20), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2026, 3, 21), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2026, 3, 22), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2026, 5, 27), "Eid al-Adha"),
            Map.entry(LocalDate.of(2026, 5, 28), "Eid al-Adha"),
            Map.entry(LocalDate.of(2026, 9, 23), "National Day"),
            Map.entry(LocalDate.of(2027, 2, 22), "Founding Day"),
            Map.entry(LocalDate.of(2027, 3, 10), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2027, 3, 11), "Eid al-Fitr"),
            Map.entry(LocalDate.of(2027, 5, 16), "Eid al-Adha"),
            Map.entry(LocalDate.of(2027, 5, 17), "Eid al-Adha"),
            Map.entry(LocalDate.of(2027, 9, 23), "National Day"));

    private static final class HeatmapAggregate {
        private BigDecimal revenue = BigDecimal.ZERO;
        private long bookings;
        private long occupiedRooms;
        private long totalRooms;
    }
}
