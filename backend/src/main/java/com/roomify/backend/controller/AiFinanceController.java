package com.roomify.backend.controller;

import com.roomify.backend.dto.ai.AiFinanceDataSummaryResponse;
import com.roomify.backend.dto.ai.AiFinanceSummaryResponse;
import com.roomify.backend.dto.ai.OccupancyTrendPoint;
import com.roomify.backend.dto.ai.RevenueTrendPoint;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.service.FinanceAnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ai-finance")
@PreAuthorize("hasRole('MANAGER')")
public class AiFinanceController {

    private final FinanceAnalyticsService financeAnalyticsService;

    public AiFinanceController(FinanceAnalyticsService financeAnalyticsService) {
        this.financeAnalyticsService = financeAnalyticsService;
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

    @GetMapping("/training-data")
    public ResponseEntity<List<TrainingDataRow>> getTrainingData(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(financeAnalyticsService.getTrainingData(start, end));
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
}
