package com.roomify.backend.service;

import com.roomify.backend.dto.ai.AiFinanceDataSummaryResponse;
import com.roomify.backend.dto.ai.AiFinanceSummaryResponse;
import com.roomify.backend.dto.ai.OccupancyTrendPoint;
import com.roomify.backend.dto.ai.RevenueTrendPoint;
import com.roomify.backend.dto.ai.RoomTypeRevenueResponse;
import com.roomify.backend.dto.ai.TrainingDataRow;
import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FinanceAnalyticsService {

    private static final Set<ReservationStatus> ACTIVE_OCCUPANCY_STATUSES = EnumSet.of(
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
            ReservationStatus.CHECKED_OUT);

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    public FinanceAnalyticsService(
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository,
            ExpenseRepository expenseRepository,
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository) {
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    public AiFinanceDataSummaryResponse getDataSummary() {
        DateRange datasetRange = resolveDatasetRange();
        List<Reservation> reservations = reservationRepository.findAllWithDetails();
        List<Payment> payments = paymentRepository.findAll();
        List<Expense> expenses = expenseRepository.findAll();
        long totalRooms = roomRepository.count();

        BigDecimal totalRevenue = sumReservationRevenue(reservations);
        double averageOccupancy = averageOccupancyForRange(reservations, datasetRange, totalRooms);

        return new AiFinanceDataSummaryResponse(
                reservations.size(),
                payments.size(),
                expenses.size(),
                datasetRange.start(),
                datasetRange.end(),
                money(totalRevenue),
                clampPercent(averageOccupancy),
                roomTypeRepository.count());
    }

    public AiFinanceSummaryResponse getFinanceSummary() {
        List<Reservation> reservations = reservationRepository.findAllWithDetails();
        List<Expense> expenses = expenseRepository.findAll();
        long totalRooms = roomRepository.count();
        LocalDate anchorDate = resolveDatasetRange().end();
        LocalDate thisWeekStart = anchorDate.minusDays(6);
        LocalDate lastWeekStart = thisWeekStart.minusDays(7);
        LocalDate lastWeekEnd = thisWeekStart.minusDays(1);

        BigDecimal thisWeekRevenue = sumReservationRevenue(
                reservations.stream()
                        .filter(reservation -> isNonCancelled(reservation)
                                && isWithin(reservation.getCheckInDate(), thisWeekStart, anchorDate))
                        .toList());
        BigDecimal lastWeekRevenue = sumReservationRevenue(
                reservations.stream()
                        .filter(reservation -> isNonCancelled(reservation)
                                && isWithin(reservation.getCheckInDate(), lastWeekStart, lastWeekEnd))
                        .toList());
        double revenueChangePercentage = calculateChangePercentage(lastWeekRevenue, thisWeekRevenue);
        double currentOccupancy = totalRooms > 0
                ? clampPercent((countOccupiedRoomNightsOnDate(reservations, anchorDate) * 100.0) / totalRooms)
                : 0.0;

        Map<String, BigDecimal> revenueByRoomType = new HashMap<>();
        reservations.stream()
                .filter(this::isNonCancelled)
                .forEach(reservation -> {
                    String roomTypeName = reservation.getRoom().getRoomType().getName();
                    revenueByRoomType.merge(roomTypeName, safeMoney(reservation.getTotalPrice()), BigDecimal::add);
                });

        String topRoomType = revenueByRoomType.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        BigDecimal totalRevenue = sumReservationRevenue(reservations);
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AiFinanceSummaryResponse(
                money(thisWeekRevenue),
                money(lastWeekRevenue),
                revenueChangePercentage,
                currentOccupancy,
                topRoomType,
                money(totalExpenses),
                money(totalRevenue.subtract(totalExpenses)));
    }

    public List<RevenueTrendPoint> getRevenueTrend(LocalDate start, LocalDate end) {
        DateRange requestedRange = resolveRange(start, end);
        List<Reservation> reservations = reservationRepository.findAllOverlappingPeriodWithDetails(
                requestedRange.start(),
                requestedRange.end());

        Map<LocalDate, BigDecimal> revenueByDate = new HashMap<>();
        reservations.stream()
                .filter(this::isNonCancelled)
                .filter(reservation -> isWithin(reservation.getCheckInDate(), requestedRange.start(), requestedRange.end()))
                .forEach(reservation -> revenueByDate.merge(
                        reservation.getCheckInDate(),
                        safeMoney(reservation.getTotalPrice()).max(BigDecimal.ZERO),
                        BigDecimal::add));

        return requestedRange.stream().stream()
                .map(date -> new RevenueTrendPoint(date, money(revenueByDate.getOrDefault(date, BigDecimal.ZERO))))
                .toList();
    }

    public List<OccupancyTrendPoint> getOccupancyTrend(LocalDate start, LocalDate end) {
        DateRange requestedRange = resolveRange(start, end);
        List<Reservation> reservations = reservationRepository.findAllOverlappingPeriodWithDetails(
                requestedRange.start(),
                requestedRange.end());
        long totalRooms = roomRepository.count();

        return requestedRange.stream().stream()
                .map(date -> {
                    long occupiedRoomNights = countOccupiedRoomNightsOnDate(reservations, date);
                    long totalRoomNights = totalRooms;
                    double occupancyRate = totalRoomNights > 0
                            ? clampPercent((occupiedRoomNights * 100.0) / totalRoomNights)
                            : 0.0;
                    return new OccupancyTrendPoint(date, occupancyRate, occupiedRoomNights, totalRoomNights);
                })
                .toList();
    }

    public List<RoomTypeRevenueResponse> getRoomTypeRevenue() {
        List<Reservation> reservations = reservationRepository.findAllWithDetails();
        Map<Long, RoomTypeAggregate> aggregates = new HashMap<>();

        reservations.stream()
                .filter(this::isNonCancelled)
                .forEach(reservation -> {
                    RoomType roomType = reservation.getRoom().getRoomType();
                    RoomTypeAggregate aggregate = aggregates.computeIfAbsent(
                            roomType.getId(),
                            ignored -> new RoomTypeAggregate(roomType.getName()));
                    aggregate.revenue = aggregate.revenue.add(safeMoney(reservation.getTotalPrice()));
                    aggregate.reservations++;
                    aggregate.totalPrice = aggregate.totalPrice.add(safeMoney(reservation.getTotalPrice()));
                });

        return aggregates.values().stream()
                .sorted(Comparator.comparing(RoomTypeAggregate::roomType))
                .map(aggregate -> new RoomTypeRevenueResponse(
                        aggregate.roomType,
                        money(aggregate.revenue),
                        aggregate.reservations,
                        aggregate.reservations > 0
                                ? money(aggregate.totalPrice.divide(
                                        BigDecimal.valueOf(aggregate.reservations),
                                        2,
                                        RoundingMode.HALF_UP))
                                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)))
                .toList();
    }

    public List<TrainingDataRow> getTrainingData(LocalDate start, LocalDate end) {
        DateRange requestedRange = resolveRange(start, end);
        List<Reservation> reservations = reservationRepository.findAllOverlappingPeriodWithDetails(
                requestedRange.start(),
                requestedRange.end());
        List<Expense> expenses = expenseRepository.findAll();
        List<RoomType> roomTypes = roomTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(RoomType::getId))
                .toList();
        Map<Long, Long> totalRoomsByType = buildRoomCountByType();
        long hotelRoomCount = totalRoomsByType.values().stream().mapToLong(Long::longValue).sum();
        Map<LocalDate, BigDecimal> expensesByDate = expenses.stream()
                .filter(expense -> isWithin(expense.getExpenseDate(), requestedRange.start(), requestedRange.end()))
                .collect(Collectors.groupingBy(
                        Expense::getExpenseDate,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));

        List<TrainingDataRow> rows = new ArrayList<>();
        for (LocalDate date : requestedRange.stream()) {
            BigDecimal totalDailyExpenses = expensesByDate.getOrDefault(date, BigDecimal.ZERO);
            for (RoomType roomType : roomTypes) {
                long totalRooms = totalRoomsByType.getOrDefault(roomType.getId(), 0L);
                if (totalRooms <= 0) {
                    continue;
                }

                List<Reservation> activeReservations = reservations.stream()
                        .filter(reservation -> belongsToRoomType(reservation, roomType.getId()))
                        .filter(this::isActiveForOccupancy)
                        .filter(reservation -> occupiesDate(reservation, date))
                        .toList();
                long occupiedRoomNights = activeReservations.size();

                long confirmedBookings = reservations.stream()
                        .filter(reservation -> belongsToRoomType(reservation, roomType.getId()))
                        .filter(this::isActiveForOccupancy)
                        .filter(reservation -> date.equals(reservation.getCheckInDate()))
                        .count();

                long cancelledBookings = reservations.stream()
                        .filter(reservation -> belongsToRoomType(reservation, roomType.getId()))
                        .filter(reservation -> reservation.getStatus() == ReservationStatus.CANCELLED)
                        .filter(reservation -> date.equals(reservation.getCheckInDate()))
                        .count();

                BigDecimal dailyRevenue = activeReservations.stream()
                        .map(this::dailyRevenueForReservation)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal averageRoomPrice = activeReservations.isEmpty()
                        ? money(roomType.getBasePrice())
                        : money(activeReservations.stream()
                                .map(this::dailyRevenueForReservation)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(BigDecimal.valueOf(activeReservations.size()), 2, RoundingMode.HALF_UP));

                BigDecimal dailyExpenses = hotelRoomCount > 0
                        ? money(totalDailyExpenses
                                .multiply(BigDecimal.valueOf(totalRooms))
                                .divide(BigDecimal.valueOf(hotelRoomCount), 2, RoundingMode.HALF_UP))
                        : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

                double occupancyRate = clampPercent((occupiedRoomNights * 100.0) / totalRooms);
                rows.add(new TrainingDataRow(
                        date,
                        date.getDayOfWeek().getValue(),
                        date.getMonthValue(),
                        isWeekend(date),
                        roomType.getName(),
                        roomType.getId(),
                        totalRooms,
                        occupiedRoomNights,
                        confirmedBookings,
                        cancelledBookings,
                        averageRoomPrice.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP),
                        money(dailyRevenue.max(BigDecimal.ZERO)),
                        dailyExpenses.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP),
                        occupancyRate));
            }
        }
        return rows;
    }

    public DateRange getDatasetRange() {
        return resolveDatasetRange();
    }

    private Map<Long, Long> buildRoomCountByType() {
        return roomRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        room -> room.getRoomType().getId(),
                        Collectors.counting()));
    }

    private double averageOccupancyForRange(List<Reservation> reservations, DateRange dateRange, long totalRooms) {
        if (totalRooms <= 0 || dateRange.isEmpty()) {
            return 0.0;
        }

        double totalRate = 0.0;
        long days = 0;
        for (LocalDate date : dateRange.stream()) {
            long occupiedRoomNights = countOccupiedRoomNightsOnDate(reservations, date);
            totalRate += clampPercent((occupiedRoomNights * 100.0) / totalRooms);
            days++;
        }
        return days > 0 ? totalRate / days : 0.0;
    }

    private long countOccupiedRoomNightsOnDate(Collection<Reservation> reservations, LocalDate date) {
        return reservations.stream()
                .filter(this::isActiveForOccupancy)
                .filter(reservation -> occupiesDate(reservation, date))
                .count();
    }

    private boolean occupiesDate(Reservation reservation, LocalDate date) {
        return !date.isBefore(reservation.getCheckInDate()) && date.isBefore(reservation.getCheckOutDate());
    }

    private boolean belongsToRoomType(Reservation reservation, Long roomTypeId) {
        return reservation.getRoom() != null
                && reservation.getRoom().getRoomType() != null
                && Objects.equals(reservation.getRoom().getRoomType().getId(), roomTypeId);
    }

    private boolean isNonCancelled(Reservation reservation) {
        return reservation.getStatus() != ReservationStatus.CANCELLED;
    }

    private boolean isActiveForOccupancy(Reservation reservation) {
        return ACTIVE_OCCUPANCY_STATUSES.contains(reservation.getStatus());
    }

    private boolean isWithin(LocalDate value, LocalDate start, LocalDate end) {
        return value != null && !value.isBefore(start) && !value.isAfter(end);
    }

    private BigDecimal dailyRevenueForReservation(Reservation reservation) {
        long nights = Math.max(1, ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate()));
        return safeMoney(reservation.getTotalPrice())
                .divide(BigDecimal.valueOf(nights), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal sumReservationRevenue(Collection<Reservation> reservations) {
        return reservations.stream()
                .filter(this::isNonCancelled)
                .map(Reservation::getTotalPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private double calculateChangePercentage(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private DateRange resolveRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return resolveDatasetRange();
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("end date must be on or after start date");
        }
        return new DateRange(start, end);
    }

    private DateRange resolveDatasetRange() {
        List<LocalDate> starts = new ArrayList<>();
        List<LocalDate> ends = new ArrayList<>();

        Optional.ofNullable(reservationRepository.findMinimumCheckInDate()).ifPresent(starts::add);
        Optional.ofNullable(expenseRepository.findMinimumExpenseDate()).ifPresent(starts::add);
        Optional.ofNullable(paymentRepository.findMinimumCreatedAt()).map(LocalDateTime::toLocalDate).ifPresent(starts::add);

        Optional.ofNullable(reservationRepository.findMaximumCheckOutDate())
                .map(date -> date.minusDays(1))
                .ifPresent(ends::add);
        Optional.ofNullable(expenseRepository.findMaximumExpenseDate()).ifPresent(ends::add);
        Optional.ofNullable(paymentRepository.findMaximumCreatedAt()).map(LocalDateTime::toLocalDate).ifPresent(ends::add);

        LocalDate today = LocalDate.now();
        LocalDate start = starts.stream().min(LocalDate::compareTo).orElse(today);
        LocalDate end = ends.stream().max(LocalDate::compareTo).orElse(start);
        if (end.isBefore(start)) {
            end = start;
        }
        return new DateRange(start, end);
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return dayOfWeek == DayOfWeek.FRIDAY || dayOfWeek == DayOfWeek.SATURDAY;
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal money(BigDecimal value) {
        return safeMoney(value).setScale(2, RoundingMode.HALF_UP);
    }

    private double clampPercent(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    public record DateRange(LocalDate start, LocalDate end) {
        public List<LocalDate> stream() {
            List<LocalDate> dates = new ArrayList<>();
            LocalDate cursor = start;
            while (!cursor.isAfter(end)) {
                dates.add(cursor);
                cursor = cursor.plusDays(1);
            }
            return dates;
        }

        public boolean isEmpty() {
            return end.isBefore(start);
        }
    }

    private static final class RoomTypeAggregate {
        private final String roomType;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal totalPrice = BigDecimal.ZERO;
        private long reservations;

        private RoomTypeAggregate(String roomType) {
            this.roomType = roomType;
        }

        private String roomType() {
            return roomType;
        }
    }
}
