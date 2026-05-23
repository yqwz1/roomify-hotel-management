package com.roomify.backend.config;

import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(3)
@Transactional
@ConditionalOnProperty(value = "roomify.ai-finance.demo-seed-enabled", havingValue = "true")
public class AiFinanceDemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AiFinanceDemoDataSeeder.class);

    private static final LocalDate HISTORY_START = LocalDate.of(2025, 1, 1);
    private static final LocalDate HISTORY_END = LocalDate.of(2026, 4, 27);
    private static final int TARGET_GUEST_COUNT = 420;
    private static final int TARGET_RESERVATION_COUNT = 1400;
    private static final int TARGET_EXPENSE_COUNT = 240;
    private static final BigDecimal VAT_RATE = new BigDecimal("0.15");

    private static final String RESERVATION_PREFIX = "AI-DEMO-RES-";
    private static final String PAYMENT_PREFIX = "AI-DEMO-PAY-";
    private static final String GUEST_PREFIX = "AI-DEMO-GUEST-";
    private static final String EXPENSE_PREFIX = "AI-DEMO-EXP-";
    private static final String ROOM_PREFIX = "AI-";
    private static final long RANDOM_SEED = 2026042801L;

    private static final List<RoomTypePlan> ROOM_TYPE_PLANS = List.of(
            new RoomTypePlan("Standard", new BigDecimal("220.00"), 2, 18,
                    "WiFi, Smart TV, Desk",
                    "Reliable entry-level room for weekday and budget travelers."),
            new RoomTypePlan("Deluxe", new BigDecimal("330.00"), 3, 12,
                    "WiFi, Smart TV, Mini Fridge, City View",
                    "Mid-tier room with stronger weekend pricing sensitivity."),
            new RoomTypePlan("Family", new BigDecimal("430.00"), 5, 8,
                    "WiFi, Smart TV, Sofa Bed, Extra Storage",
                    "Larger configuration used for longer family stays."),
            new RoomTypePlan("Executive", new BigDecimal("540.00"), 3, 5,
                    "WiFi, Smart TV, Lounge Access, Workstation",
                    "Business-oriented room type with stronger corporate demand."),
            new RoomTypePlan("Suite", new BigDecimal("760.00"), 4, 5,
                    "WiFi, Smart TV, Living Area, Balcony",
                    "Premium room type with pronounced seasonal price movement."));

    private static final List<String> FIRST_NAMES = List.of(
            "Ahmed", "Omar", "Yousef", "Faisal", "Khalid", "Nasser", "Salman", "Saad",
            "Reem", "Lama", "Noor", "Sarah", "Abeer", "Mona", "Huda", "Rania",
            "David", "Adam", "Mason", "Liam", "Emma", "Olivia", "Sophia", "Mia",
            "Daniel", "Hassan", "Zaid", "Farah", "Nora", "Layla", "John", "Emily");

    private static final List<String> LAST_NAMES = List.of(
            "Alharbi", "Alqahtani", "Alyami", "Almutairi", "Alghamdi", "Alshammari",
            "Khan", "Hassan", "Ibrahim", "Rahman", "Santos", "Miller", "Smith",
            "Johnson", "Brown", "Anderson", "Williams", "Clark", "Taylor", "Walker");

    private static final List<String> NATIONALITIES = List.of(
            "Saudi", "Emirati", "Kuwaiti", "Bahraini", "Qatari", "Omani",
            "Egyptian", "Jordanian", "Pakistani", "Indian", "British", "American");

    private static final List<String> CANCELLATION_REASONS = List.of(
            "Travel plans changed",
            "Flight delay",
            "Corporate schedule change",
            "Guest requested cancellation",
            "Visa issue");

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${roomify.ai-finance.demo-seed-reset:false}")
    private boolean demoSeedReset;

    public AiFinanceDemoDataSeeder(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            GuestRepository guestRepository,
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository,
            ExpenseRepository expenseRepository,
            JdbcTemplate jdbcTemplate) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (demoSeedReset) {
            deleteAiFinanceDemoData();
        } else if (hasExistingAiFinanceData()) {
            log.info("AI Finance demo data already exists and reset is disabled. Skipping generation.");
            return;
        }

        Random random = new Random(RANDOM_SEED);

        Map<String, RoomType> roomTypesByName = seedRoomTypes();
        List<Room> rooms = seedRooms(roomTypesByName);
        List<Guest> guests = seedGuests();
        List<Reservation> reservations = seedReservations(rooms, guests, random);
        reservationRepository.saveAll(reservations);
        reservationRepository.flush();

        List<Payment> payments = seedPayments(reservations, random);
        paymentRepository.saveAll(payments);

        List<Expense> expenses = seedExpenses(reservations, random);
        expenseRepository.saveAll(expenses);

        reservationRepository.saveAll(reservations);
        validateSeedResults();

        log.info(
                "AI Finance demo data ready: roomTypes={}, rooms={}, reservations={}, payments={}, expenses={}",
                roomTypesByName.size(),
                rooms.size(),
                countByPrefix("reservations", "confirmation_number", RESERVATION_PREFIX),
                countByPrefix("payments", "gateway_reference", PAYMENT_PREFIX),
                countByPrefix("expenses", "receipt_file_name", EXPENSE_PREFIX));
    }

    private Map<String, RoomType> seedRoomTypes() {
        Map<String, RoomType> roomTypesByName = new HashMap<>();
        for (RoomTypePlan plan : ROOM_TYPE_PLANS) {
            RoomType roomType = roomTypeRepository.findByName(plan.name()).orElseGet(RoomType::new);
            roomType.setName(plan.name());
            roomType.setBasePrice(plan.basePrice());
            roomType.setMaxGuests(plan.maxGuests());
            roomType.setAmenities(plan.amenities());
            roomType.setDescription(plan.description());
            roomTypesByName.put(plan.name(), roomTypeRepository.save(roomType));
        }
        return roomTypesByName;
    }

    private List<Room> seedRooms(Map<String, RoomType> roomTypesByName) {
        List<Room> rooms = new ArrayList<>();
        int floor = 1;
        int sequence = 1;

        for (RoomTypePlan plan : ROOM_TYPE_PLANS) {
            for (int index = 0; index < plan.roomCount(); index++) {
                if (index > 0 && index % 10 == 0) {
                    floor++;
                    sequence = 1;
                }

                String roomNumber = ROOM_PREFIX + floor + String.format(Locale.ROOT, "%02d", sequence++);
                Room room = roomRepository.findByRoomNumber(roomNumber).orElseGet(Room::new);
                room.setRoomNumber(roomNumber);
                room.setRoomType(roomTypesByName.get(plan.name()));
                room.setFloor(floor);
                room.setStatus(RoomStatus.AVAILABLE);
                rooms.add(roomRepository.save(room));
            }
            floor++;
            sequence = 1;
        }

        rooms.sort(Comparator.comparing(Room::getRoomNumber));
        return rooms;
    }

    private List<Guest> seedGuests() {
        List<Guest> guests = new ArrayList<>(TARGET_GUEST_COUNT);

        for (int index = 1; index <= TARGET_GUEST_COUNT; index++) {
            String firstName = FIRST_NAMES.get((index - 1) % FIRST_NAMES.size());
            String lastName = LAST_NAMES.get(((index - 1) / 3) % LAST_NAMES.size());
            String email = "ai.demo.guest" + formatSixDigits(index) + "@roomify.dev";
            Guest guest = guestRepository.findByEmailIgnoreCase(email).orElseGet(Guest::new);

            guest.setName(firstName + " " + lastName);
            guest.setEmail(email);
            guest.setPhone("+9665" + String.format(Locale.ROOT, "%08d", 10000000 + index));
            guest.setIdNumber(GUEST_PREFIX + formatSixDigits(index));
            guest.setNationality(NATIONALITIES.get((index - 1) % NATIONALITIES.size()));
            guests.add(guest);
        }

        return guestRepository.saveAll(guests);
    }

    private List<Reservation> seedReservations(List<Room> rooms, List<Guest> guests, Random random) {
        List<Reservation> existingReservations = reservationRepository.findAll();
        Map<Long, List<DateRange>> occupiedByRoom = new HashMap<>();
        Map<String, List<Room>> roomsByType = groupRoomsByType(rooms);
        List<Reservation> generatedReservations = new ArrayList<>(TARGET_RESERVATION_COUNT);

        for (Reservation existing : existingReservations) {
            if (existing.getStatus() != ReservationStatus.CANCELLED) {
                occupiedByRoom.computeIfAbsent(existing.getRoomId(), ignored -> new ArrayList<>())
                        .add(new DateRange(existing.getCheckInDate(), existing.getCheckOutDate()));
            }
        }

        int reservationNumber = 1;
        int attempts = 0;
        while (generatedReservations.size() < TARGET_RESERVATION_COUNT && attempts < TARGET_RESERVATION_COUNT * 25) {
            attempts++;
            LocalDate checkInDate = randomDate(random, HISTORY_START, HISTORY_END);
            int stayLength = 1 + random.nextInt(5);
            LocalDate checkOutDate = checkInDate.plusDays(stayLength);
            boolean cancelled = random.nextDouble() < 0.08d;
            RoomTypePlan plan = pickRoomTypePlan(random);
            List<Room> eligibleRooms = roomsByType.get(plan.name());

            if (eligibleRooms == null || eligibleRooms.isEmpty()) {
                continue;
            }

            Room room = pickAvailableRoom(eligibleRooms, occupiedByRoom, checkInDate, checkOutDate, cancelled, random);
            if (room == null) {
                continue;
            }

            Guest guest = guests.get(random.nextInt(guests.size()));
            Reservation reservation = new Reservation();
            reservation.setGuest(guest);
            reservation.setRoom(room);
            reservation.setCheckInDate(checkInDate);
            reservation.setCheckOutDate(checkOutDate);
            reservation.setConfirmationNumber(RESERVATION_PREFIX + formatSixDigits(reservationNumber++));
            reservation.setStatus(resolveReservationStatus(checkInDate, checkOutDate, cancelled));
            reservation.setCreatedAt(buildCreatedAt(checkInDate, random));
            reservation.setModifiedAt(reservation.getCreatedAt());
            reservation.setCancellationReason(cancelled ? pick(random, CANCELLATION_REASONS) : null);
            reservation.setCancellationAt(cancelled ? reservation.getCreatedAt().plusDays(1 + random.nextInt(10)) : null);
            reservation.setActualCheckInDate(resolveActualCheckInDate(reservation));
            reservation.setActualCheckOutAt(resolveActualCheckOutAt(reservation));
            reservation.setModificationReason(null);
            reservation.setInvoiceNumber(null);

            BigDecimal totalPrice = calculateReservationTotal(plan, checkInDate, stayLength, random);
            reservation.setTotalPrice(totalPrice);
            reservation.setTotalPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            reservation.setOutstandingBalance(totalPrice);
            reservation.setPaymentStatus(cancelled ? PaymentStatus.UNPAID : PaymentStatus.PENDING);
            reservation.setInvoiceFinalized(false);

            if (!cancelled) {
                occupiedByRoom.computeIfAbsent(room.getId(), ignored -> new ArrayList<>())
                        .add(new DateRange(checkInDate, checkOutDate));
            }

            generatedReservations.add(reservation);
        }

        if (generatedReservations.size() < 1000) {
            throw new IllegalStateException("AI Finance seed generation produced fewer than 1000 reservations.");
        }

        return generatedReservations;
    }

    private List<Payment> seedPayments(List<Reservation> reservations, Random random) {
        List<Payment> payments = new ArrayList<>();
        int paymentNumber = 1;

        for (Reservation reservation : reservations) {
            if (reservation.getStatus() == ReservationStatus.CANCELLED) {
                continue;
            }

            Payment payment = new Payment();
            payment.setReservation(reservation);
            payment.setPaymentMethod(pickPaymentMethod(random));

            boolean fullyPaid = random.nextDouble() < 0.85d;
            BigDecimal amount = fullyPaid
                    ? reservation.getTotalPrice()
                    : reservation.getTotalPrice()
                            .multiply(BigDecimal.valueOf(0.45d + (random.nextDouble() * 0.35d)))
                            .setScale(2, RoundingMode.HALF_UP);

            payment.setAmount(amount);
            payment.setPaymentStatus(fullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID);
            payment.setGatewayReference(PAYMENT_PREFIX + formatSixDigits(paymentNumber++));
            payment.setFailureReason(null);
            payment.setCreatedAt(buildPaymentTimestamp(reservation, random));

            reservation.setTotalPaid(amount);
            reservation.setOutstandingBalance(reservation.getTotalPrice().subtract(amount).max(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP));
            reservation.setPaymentStatus(fullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID);
            reservation.setInvoiceFinalized(fullyPaid);

            payments.add(payment);
        }

        return payments;
    }

    private List<Expense> seedExpenses(List<Reservation> reservations, Random random) {
        List<Expense> expenses = new ArrayList<>(TARGET_EXPENSE_COUNT);
        Map<LocalDate, Integer> occupancyByDate = buildOccupancyByDate(reservations);
        List<YearMonth> months = listMonths(HISTORY_START, HISTORY_END);
        int expenseNumber = 1;

        for (YearMonth month : months) {
            expenses.add(createExpense(expenseNumber++, "Payroll - Front Office - " + month,
                    ExpenseCategory.SALARIES, amount(random, 18000, 26000),
                    randomDateInMonth(random, month, 25), "Roomify Payroll", PaymentMethod.BANK_TRANSFER, true));
            expenses.add(createExpense(expenseNumber++, "Payroll - Housekeeping - " + month,
                    ExpenseCategory.SALARIES, amount(random, 16000, 24000),
                    randomDateInMonth(random, month, 27), "Roomify Payroll", PaymentMethod.BANK_TRANSFER, true));
            expenses.add(createExpense(expenseNumber++, "Electricity & Water - " + month,
                    ExpenseCategory.UTILITIES, amount(random, 5200, 11800),
                    randomDateInMonth(random, month, 5), "National Utilities", PaymentMethod.ONLINE, true));
            expenses.add(createExpense(expenseNumber++, "Internet & Telecom - " + month,
                    ExpenseCategory.UTILITIES, amount(random, 1800, 3600),
                    randomDateInMonth(random, month, 9), "Gulf Telecom", PaymentMethod.ONLINE, true));
            expenses.add(createExpense(expenseNumber++, "Digital Campaign - " + month,
                    ExpenseCategory.MARKETING, amount(random, 2500, 8400),
                    randomDateInMonth(random, month, 14), "Travel Media Hub", PaymentMethod.CARD, false));
            expenses.add(createExpense(expenseNumber++, "Guest Supplies - " + month,
                    ExpenseCategory.CONSUMABLES, amount(random, 850, 2400),
                    randomDateInMonth(random, month, 18), "Hospitality Supply Co.", PaymentMethod.CARD, false));
            expenses.add(createExpense(expenseNumber++, "Cleaning Restock - " + month,
                    ExpenseCategory.CLEANING_SUPPLIES, amount(random, 900, 3200),
                    randomDateInMonth(random, month, 21), "CleanPro Trading", PaymentMethod.CARD, false));
            expenses.add(createExpense(expenseNumber++, "Preventive Maintenance - " + month,
                    ExpenseCategory.MAINTENANCE, amount(random, 1800, 7600),
                    randomDateInMonth(random, month, 11), "Facility Masters", PaymentMethod.BANK_TRANSFER, false));
        }

        while (expenses.size() < TARGET_EXPENSE_COUNT) {
            LocalDate expenseDate = weightedCleaningDate(occupancyByDate, random);
            int occupiedRooms = occupancyByDate.getOrDefault(expenseDate, 0);
            BigDecimal amount = BigDecimal.valueOf(450L + (occupiedRooms * 35L) + random.nextInt(420))
                    .setScale(2, RoundingMode.HALF_UP);
            expenses.add(createExpense(expenseNumber++, "Daily Cleaning Allocation - " + expenseDate,
                    ExpenseCategory.CLEANING_SUPPLIES, amount,
                    expenseDate, "CleanPro Trading", PaymentMethod.CASH, false));
        }

        return expenses;
    }

    private void validateSeedResults() {
        long reservationCount = countByPrefix("reservations", "confirmation_number", RESERVATION_PREFIX);
        long paymentCount = countByPrefix("payments", "gateway_reference", PAYMENT_PREFIX);
        long expenseCount = countByPrefix("expenses", "receipt_file_name", EXPENSE_PREFIX);
        long roomCount = countByLike("rooms", "room_number", ROOM_PREFIX + "%");
        Long overlapCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM reservations first_reservation
                JOIN reservations second_reservation
                  ON first_reservation.room_id = second_reservation.room_id
                 AND first_reservation.id < second_reservation.id
                 AND first_reservation.confirmation_number LIKE ?
                 AND second_reservation.confirmation_number LIKE ?
                 AND first_reservation.status <> 'CANCELLED'
                 AND second_reservation.status <> 'CANCELLED'
                 AND first_reservation.check_in_date < second_reservation.check_out_date
                 AND first_reservation.check_out_date > second_reservation.check_in_date
                """, Long.class, RESERVATION_PREFIX + "%", RESERVATION_PREFIX + "%");

        if (reservationCount < 1000) {
            throw new IllegalStateException("AI Finance demo seed must create at least 1000 reservations.");
        }
        if (paymentCount == 0 || expenseCount == 0 || roomCount == 0) {
            throw new IllegalStateException("AI Finance demo seed did not create the required linked data.");
        }
        if (overlapCount != null && overlapCount > 0) {
            throw new IllegalStateException("AI Finance demo seed detected overlapping active reservations.");
        }
    }

    private void deleteAiFinanceDemoData() {
        jdbcTemplate.update("DELETE FROM payments WHERE gateway_reference LIKE ?", PAYMENT_PREFIX + "%");
        jdbcTemplate.update("DELETE FROM reservations WHERE confirmation_number LIKE ?", RESERVATION_PREFIX + "%");
        jdbcTemplate.update("DELETE FROM expenses WHERE receipt_file_name LIKE ?", EXPENSE_PREFIX + "%");
        jdbcTemplate.update("DELETE FROM rooms WHERE room_number LIKE ?", ROOM_PREFIX + "%");
        jdbcTemplate.update("DELETE FROM guests WHERE id_number LIKE ?", GUEST_PREFIX + "%");
        log.info("AI Finance demo data reset completed.");
    }

    private boolean hasExistingAiFinanceData() {
        return countByPrefix("reservations", "confirmation_number", RESERVATION_PREFIX) > 0
                || countByPrefix("payments", "gateway_reference", PAYMENT_PREFIX) > 0
                || countByPrefix("expenses", "receipt_file_name", EXPENSE_PREFIX) > 0
                || countByLike("rooms", "room_number", ROOM_PREFIX + "%") > 0
                || countByPrefix("guests", "id_number", GUEST_PREFIX) > 0;
    }

    private long countByPrefix(String tableName, String columnName, String prefix) {
        return countByLike(tableName, columnName, prefix + "%");
    }

    private long countByLike(String tableName, String columnName, String pattern) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " LIKE ?",
                Long.class,
                pattern);
        return count == null ? 0L : count;
    }

    private Map<String, List<Room>> groupRoomsByType(List<Room> rooms) {
        Map<String, List<Room>> roomsByType = new HashMap<>();
        for (Room room : rooms) {
            roomsByType.computeIfAbsent(room.getRoomType().getName(), ignored -> new ArrayList<>()).add(room);
        }
        return roomsByType;
    }

    private RoomTypePlan pickRoomTypePlan(Random random) {
        int roll = random.nextInt(100);
        if (roll < 34) {
            return ROOM_TYPE_PLANS.get(0);
        }
        if (roll < 58) {
            return ROOM_TYPE_PLANS.get(1);
        }
        if (roll < 74) {
            return ROOM_TYPE_PLANS.get(2);
        }
        if (roll < 88) {
            return ROOM_TYPE_PLANS.get(3);
        }
        return ROOM_TYPE_PLANS.get(4);
    }

    private Room pickAvailableRoom(
            List<Room> eligibleRooms,
            Map<Long, List<DateRange>> occupiedByRoom,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            boolean cancelled,
            Random random) {

        List<Room> shuffled = new ArrayList<>(eligibleRooms);
        Collections.shuffle(shuffled, random);

        for (Room room : shuffled) {
            if (cancelled || isAvailable(room, occupiedByRoom, checkInDate, checkOutDate)) {
                return room;
            }
        }
        return null;
    }

    private boolean isAvailable(
            Room room,
            Map<Long, List<DateRange>> occupiedByRoom,
            LocalDate checkInDate,
            LocalDate checkOutDate) {

        List<DateRange> dateRanges = occupiedByRoom.getOrDefault(room.getId(), List.of());
        for (DateRange existing : dateRanges) {
            if (existing.checkIn().isBefore(checkOutDate) && existing.checkOut().isAfter(checkInDate)) {
                return false;
            }
        }
        return true;
    }

    private ReservationStatus resolveReservationStatus(LocalDate checkInDate, LocalDate checkOutDate, boolean cancelled) {
        if (cancelled) {
            return ReservationStatus.CANCELLED;
        }

        LocalDate today = LocalDate.now();
        if (!checkOutDate.isAfter(today)) {
            return ReservationStatus.CHECKED_OUT;
        }
        if (!checkInDate.isAfter(today) && checkOutDate.isAfter(today)) {
            return ReservationStatus.CHECKED_IN;
        }
        return ReservationStatus.CONFIRMED;
    }

    private LocalDate resolveActualCheckInDate(Reservation reservation) {
        return switch (reservation.getStatus()) {
            case CHECKED_IN, CHECKED_OUT -> reservation.getCheckInDate();
            default -> null;
        };
    }

    private LocalDateTime resolveActualCheckOutAt(Reservation reservation) {
        if (reservation.getStatus() == ReservationStatus.CHECKED_OUT) {
            return reservation.getCheckOutDate().atTime(11, 0);
        }
        return null;
    }

    private LocalDateTime buildCreatedAt(LocalDate checkInDate, Random random) {
        LocalDate createdDate = checkInDate.minusDays(3 + random.nextInt(60));
        if (createdDate.isBefore(HISTORY_START.minusDays(30))) {
            createdDate = HISTORY_START.minusDays(random.nextInt(10));
        }
        return createdDate.atTime(9 + random.nextInt(8), random.nextInt(60));
    }

    private LocalDateTime buildPaymentTimestamp(Reservation reservation, Random random) {
        LocalDate baseDate = reservation.getCheckInDate().minusDays(random.nextInt(7));
        if (baseDate.isBefore(reservation.getCreatedAt().toLocalDate())) {
            baseDate = reservation.getCreatedAt().toLocalDate().plusDays(random.nextInt(5));
        }
        if (reservation.getStatus() == ReservationStatus.CHECKED_OUT && random.nextBoolean()) {
            baseDate = reservation.getCheckOutDate().minusDays(random.nextInt(2) + 1);
        }
        return baseDate.atTime(10 + random.nextInt(7), random.nextInt(60));
    }

    private BigDecimal calculateReservationTotal(
            RoomTypePlan plan,
            LocalDate checkInDate,
            int stayLength,
            Random random) {
        BigDecimal base = plan.basePrice().multiply(BigDecimal.valueOf(stayLength));
        BigDecimal seasonalMultiplier = seasonalMultiplier(checkInDate);
        BigDecimal weekendMultiplier = weekendMultiplier(checkInDate);
        BigDecimal roomTypeVariation = roomTypeVariation(plan.name(), random);
        BigDecimal randomVariation = BigDecimal.valueOf(0.97d + (random.nextDouble() * 0.08d));

        BigDecimal subtotal = base
                .multiply(seasonalMultiplier)
                .multiply(weekendMultiplier)
                .multiply(roomTypeVariation)
                .multiply(randomVariation)
                .setScale(2, RoundingMode.HALF_UP);

        return subtotal.multiply(BigDecimal.ONE.add(VAT_RATE)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal seasonalMultiplier(LocalDate checkInDate) {
        return switch (checkInDate.getMonth()) {
            case JANUARY, FEBRUARY, DECEMBER -> new BigDecimal("1.28");
            case JULY, AUGUST -> new BigDecimal("1.38");
            case JUNE, SEPTEMBER -> new BigDecimal("0.90");
            case OCTOBER, NOVEMBER -> new BigDecimal("1.10");
            default -> new BigDecimal("1.00");
        };
    }

    private BigDecimal weekendMultiplier(LocalDate checkInDate) {
        DayOfWeek dayOfWeek = checkInDate.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.FRIDAY || dayOfWeek == DayOfWeek.SATURDAY) {
            return new BigDecimal("1.20");
        }
        if (dayOfWeek == DayOfWeek.THURSDAY) {
            return new BigDecimal("1.10");
        }
        return new BigDecimal("0.96");
    }

    private BigDecimal roomTypeVariation(String roomTypeName, Random random) {
        BigDecimal baseVariation = switch (roomTypeName) {
            case "Standard" -> new BigDecimal("1.00");
            case "Deluxe" -> new BigDecimal("1.05");
            case "Family" -> new BigDecimal("1.08");
            case "Executive" -> new BigDecimal("1.12");
            case "Suite" -> new BigDecimal("1.18");
            default -> BigDecimal.ONE;
        };
        return baseVariation.multiply(BigDecimal.valueOf(0.98d + (random.nextDouble() * 0.06d)));
    }

    private PaymentMethod pickPaymentMethod(Random random) {
        int roll = random.nextInt(100);
        if (roll < 55) {
            return PaymentMethod.CARD;
        }
        if (roll < 75) {
            return PaymentMethod.ONLINE;
        }
        if (roll < 90) {
            return PaymentMethod.CASH;
        }
        return PaymentMethod.BANK_TRANSFER;
    }

    private Map<LocalDate, Integer> buildOccupancyByDate(List<Reservation> reservations) {
        Map<LocalDate, Integer> occupancyByDate = new HashMap<>();
        for (Reservation reservation : reservations) {
            if (reservation.getStatus() == ReservationStatus.CANCELLED) {
                continue;
            }
            for (LocalDate cursor = reservation.getCheckInDate(); cursor.isBefore(reservation.getCheckOutDate());
                    cursor = cursor.plusDays(1)) {
                occupancyByDate.merge(cursor, 1, Integer::sum);
            }
        }
        return occupancyByDate;
    }

    private List<YearMonth> listMonths(LocalDate startDate, LocalDate endDate) {
        List<YearMonth> months = new ArrayList<>();
        YearMonth cursor = YearMonth.from(startDate);
        YearMonth end = YearMonth.from(endDate);
        while (!cursor.isAfter(end)) {
            months.add(cursor);
            cursor = cursor.plusMonths(1);
        }
        return months;
    }

    private Expense createExpense(
            int expenseNumber,
            String title,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String vendor,
            PaymentMethod paymentMethod,
            boolean recurring) {
        Expense expense = new Expense();
        expense.setTitle(title);
        expense.setDescription("AI Finance seeded historical expense for analytics demos.");
        expense.setCategory(category);
        expense.setAmount(amount.setScale(2, RoundingMode.HALF_UP));
        expense.setExpenseDate(expenseDate);
        expense.setVendor(vendor);
        expense.setPaymentMethod(paymentMethod);
        expense.setRecurring(recurring);
        expense.setReceiptFileName(EXPENSE_PREFIX + formatSixDigits(expenseNumber) + ".pdf");
        expense.setReceiptFileUrl("/demo/receipts/" + EXPENSE_PREFIX.toLowerCase(Locale.ROOT) + formatSixDigits(expenseNumber));
        expense.setCreatedAt(expenseDate.atTime(9, 30));
        expense.setUpdatedAt(expenseDate.atTime(9, 30));
        return expense;
    }

    private LocalDate weightedCleaningDate(Map<LocalDate, Integer> occupancyByDate, Random random) {
        List<Map.Entry<LocalDate, Integer>> entries = new ArrayList<>(occupancyByDate.entrySet());
        if (entries.isEmpty()) {
            return HISTORY_START.plusDays(random.nextInt((int) (HISTORY_END.toEpochDay() - HISTORY_START.toEpochDay() + 1)));
        }

        entries.sort(Map.Entry.comparingByKey());
        long totalWeight = entries.stream().mapToLong(entry -> Math.max(1, entry.getValue())).sum();
        long pick = 1 + random.nextLong(totalWeight);
        long running = 0;

        for (Map.Entry<LocalDate, Integer> entry : entries) {
            running += Math.max(1, entry.getValue());
            if (running >= pick) {
                return entry.getKey();
            }
        }
        return entries.get(entries.size() - 1).getKey();
    }

    private LocalDate randomDate(Random random, LocalDate startDate, LocalDate endDate) {
        long dayRange = endDate.toEpochDay() - startDate.toEpochDay();
        return startDate.plusDays(random.nextLong(dayRange + 1));
    }

    private LocalDate randomDateInMonth(Random random, YearMonth month, int preferredDay) {
        int maxDay = month.lengthOfMonth();
        int day = Math.min(maxDay, Math.max(1, preferredDay + random.nextInt(5) - 2));
        return month.atDay(day);
    }

    private BigDecimal amount(Random random, int minInclusive, int maxInclusive) {
        return BigDecimal.valueOf(minInclusive + random.nextInt(maxInclusive - minInclusive + 1))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String formatSixDigits(int value) {
        return String.format(Locale.ROOT, "%06d", value);
    }

    private String pick(Random random, List<String> values) {
        return values.get(random.nextInt(values.size()));
    }

    private record RoomTypePlan(
            String name,
            BigDecimal basePrice,
            int maxGuests,
            int roomCount,
            String amenities,
            String description) {
    }

    private record DateRange(LocalDate checkIn, LocalDate checkOut) {
    }
}
