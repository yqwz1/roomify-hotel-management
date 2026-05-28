package com.roomify.backend.config;

import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.HotelService;
import com.roomify.backend.entity.InventoryCategory;
import com.roomify.backend.entity.InventoryItem;
import com.roomify.backend.entity.InventoryTransaction;
import com.roomify.backend.entity.InventoryTransactionType;
import com.roomify.backend.entity.InventoryUnitOfMeasure;
import com.roomify.backend.entity.Invoice;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.entity.ServiceCategory;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.HotelServiceRepository;
import com.roomify.backend.repository.InventoryItemRepository;
import com.roomify.backend.repository.InvoiceRepository;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.service.ReservationFinancialService;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.TreeMap;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rich, idempotent demo seeder for Roomify.
 *
 * Phase 1: users, rooms, guests, reservations (~300 with 2y of Saudi
 * seasonality), payments, invoices, and audit logs.
 * Phase 2: hotel services (8), service charges (~80), expenses (~80),
 * inventory items (15) + transactions (~70), notifications (5).
 *
 * Idempotency marker: presence of the seeded staff user
 * "noura.alharbi@roomify.demo". The Guest entity has no notes column so we
 * cannot use the marker style suggested in the brief.
 *
 * Side effects are suppressed by going through repositories directly rather
 * than through the @Service layer that would otherwise dispatch emails,
 * notifications and AI pricing calls.
 *
 * Random uses a fixed seed (42) so the demo data is identical across machines.
 */
@Component
@Order(1)
@Transactional
@ConditionalOnProperty(value = "roomify.demo.bootstrap.enabled", havingValue = "true")
public class DemoDataBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataBootstrap.class);

    private static final String DEMO_ADMIN_EMAIL = "admin@roomify.demo";
    private static final String LEGACY_DEMO_ADMIN_EMAIL = "admin@roomify.com";
    private static final String DEMO_MANAGER_EMAIL = "manager@roomify.com";
    private static final String DEMO_STAFF_EMAIL = "staff@roomify.com";
    private static final String DEMO_GUEST_EMAIL = "guest@roomify.com";
    private static final String DEMO_ADMIN_PASSWORD = "Admin@12345";
    private static final String DEMO_PASSWORD = "Demo@2026";
    private static final String DEMO_GUEST_CONFIRMATION = "DEMO-GUEST-QUICK";

    // Idempotency marker — one of the new Phase-1 staff accounts.
    private static final String SEED_MARKER_EMAIL = "noura.alharbi@roomify.demo";

    private static final String SEEDED_GUEST_NOTE = "Seeded by DemoDataBootstrap";

    private static final long RANDOM_SEED = 42L;

    private static final int TARGET_GUEST_COUNT = 40;
    // Bumped from 260 to 290 to densify the 2-year history chart. With ~3 nights
    // per stay each reservation fills only 3 of 731 daily revenue points, so more
    // samples are needed before the chart stops looking sparse in the older half.
    private static final int TARGET_PAST_RESERVATIONS = 290;
    private static final int TARGET_CHECKED_IN = 8;
    private static final int TARGET_CONFIRMED_FUTURE = 28;
    private static final int TARGET_PENDING_FUTURE = 4;
    private static final int PAST_HISTORY_DAYS = 730;
    private static final int FUTURE_WINDOW_DAYS = 30;

    private static final DateTimeFormatter INVOICE_YEAR_FORMAT = DateTimeFormatter.ofPattern("yyyy");

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final HotelServiceRepository hotelServiceRepository;
    private final ExpenseRepository expenseRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final ReservationFinancialService reservationFinancialService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DemoDataBootstrap(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            GuestRepository guestRepository,
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            HotelServiceRepository hotelServiceRepository,
            ExpenseRepository expenseRepository,
            InventoryItemRepository inventoryItemRepository,
            ReservationFinancialService reservationFinancialService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.hotelServiceRepository = hotelServiceRepository;
        this.expenseRepository = expenseRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.reservationFinancialService = reservationFinancialService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        LocalDate today = LocalDate.now();
        cleanupKnownLocalDemoClutter();
        seedCoreUsers();
        seedStableDemoSearchInventory();
        seedDemoGuestReservationIfPossible(today);
        seedMissingPageDemoData(today);

        if (userRepository.findByEmailIgnoreCase(SEED_MARKER_EMAIL).isPresent()) {
            log.info("Demo data already present, skipping seeding.");
            return;
        }

        long startedAt = System.currentTimeMillis();
        Random random = new Random(RANDOM_SEED);

        List<User> seededStaff = seedAdditionalStaff();
        User managerUser = userRepository.findByEmailIgnoreCase(DEMO_MANAGER_EMAIL).orElseThrow();

        Map<String, RoomType> roomTypes = seedRoomTypes();
        List<Room> rooms = seedRooms(roomTypes);

        Guest demoGuest = upsertDemoGuestRecord();
        List<Guest> generatedGuests = seedGuests();
        // demoGuest excluded from generated list so existing scripted reservations stay attached to it.

        SeedReport report = seedReservations(today, rooms, generatedGuests, demoGuest, random);
        seedDemoGuestReservationIfPossible(today);

        seedPayments(report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_OUT, List.of()), random);
        seedInvoices(report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_OUT, List.of()), random);

        markCurrentlyOccupiedRooms(report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_IN, List.of()));

        seedAuditLogs(managerUser, seededStaff, report, random);

        // Phase 2 — see brief sections B1..B6.
        List<HotelService> services = seedHotelServices();
        int serviceChargeCount = seedServiceCharges(
                report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_OUT, List.of()),
                services, random);
        int expenseCount = seedExpenses(managerUser, today, random);
        List<InventoryItem> inventoryItems = seedInventoryItems();
        int inventoryTxCount = seedInventoryTransactions(inventoryItems, managerUser, seededStaff, today, random);

        Phase2Counts phase2 = new Phase2Counts(
                services.size(), serviceChargeCount, expenseCount,
                inventoryItems.size(), inventoryTxCount);

        long durationMs = System.currentTimeMillis() - startedAt;
        logSummary(report, phase2, durationMs);
    }

    // ─── Users ──────────────────────────────────────────────────────────────

    private void seedCoreUsers() {
        upsertDemoAdminUser();
        createSimpleUserIfMissing(DEMO_MANAGER_EMAIL, Role.MANAGER, DEMO_PASSWORD);
        createStaffUserIfMissing(DEMO_STAFF_EMAIL, "Demo Staff", "Front Desk", DEMO_PASSWORD);
        createSimpleUserIfMissing(DEMO_GUEST_EMAIL, Role.GUEST, DEMO_PASSWORD);
    }

    private User upsertDemoAdminUser() {
        User user = userRepository.findByEmailIgnoreCase(DEMO_ADMIN_EMAIL)
                .or(() -> userRepository.findByEmailIgnoreCase(LEGACY_DEMO_ADMIN_EMAIL))
                .orElseGet(() -> new User(
                        DEMO_ADMIN_EMAIL,
                        passwordEncoder.encode(DEMO_ADMIN_PASSWORD),
                        Role.ADMIN,
                        true));

        user.setEmail(DEMO_ADMIN_EMAIL);
        user.setPasswordHash(passwordEncoder.encode(DEMO_ADMIN_PASSWORD));
        user.setRole(Role.ADMIN);
        user.setRoles(EnumSet.of(Role.ADMIN, Role.MANAGER, Role.STAFF));
        user.setActive(true);
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        return userRepository.save(user);
    }

    private List<User> seedAdditionalStaff() {
        return List.of(
                createStaffUserIfMissing(SEED_MARKER_EMAIL, "Noura Al-Harbi", "Front Desk", randomDisabledDemoPassword()),
                createStaffUserIfMissing("khalid.alqahtani@roomify.demo", "Khalid Al-Qahtani", "Reservations", randomDisabledDemoPassword()),
                createStaffUserIfMissing("sara.almutairi@roomify.demo", "Sara Al-Mutairi", "Housekeeping", randomDisabledDemoPassword()));
    }

    private User createSimpleUserIfMissing(String email, Role role, String rawPassword) {
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = new User(email, passwordEncoder.encode(rawPassword), role, true);
        user.setRoles(EnumSet.of(role));
        return userRepository.save(user);
    }

    private User createStaffUserIfMissing(String email, String name, String department, String rawPassword) {
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = new User(email, passwordEncoder.encode(rawPassword), Role.STAFF, true);
        user.setRoles(EnumSet.of(Role.STAFF));

        Staff staff = new Staff(user, name, department);
        user.setStaff(staff);
        staff.setName(name);
        staff.setDepartment(department);
        staff.setActive(true);
        return userRepository.save(user);
    }

    private String randomDisabledDemoPassword() {
        return "disabled-demo-" + UUID.randomUUID();
    }

    // ─── Room types and rooms ───────────────────────────────────────────────

    private Map<String, RoomType> seedRoomTypes() {
        Map<String, RoomType> map = new HashMap<>();
        map.put("Standard", upsertRoomType("Standard", new BigDecimal("350.00"), 2,
                "WiFi, Smart TV, Breakfast",
                "Entry-level room for weekday and budget travellers."));
        map.put("Deluxe", upsertRoomType("Deluxe", new BigDecimal("700.00"), 3,
                "WiFi, Smart TV, Coffee Station, City View",
                "Mid-tier room with a stronger weekend rate."));
        map.put("Suite", upsertRoomType("Suite", new BigDecimal("1400.00"), 4,
                "WiFi, Smart TV, Lounge Area, Balcony",
                "Premium room with the most seasonal price movement."));
        return map;
    }

    private RoomType upsertRoomType(String name, BigDecimal basePrice, int maxGuests, String amenities, String description) {
        RoomType type = roomTypeRepository.findByName(name).orElseGet(RoomType::new);
        type.setName(name);
        type.setBasePrice(basePrice);
        type.setMaxGuests(maxGuests);
        type.setAmenities(amenities);
        type.setDescription(description);
        return roomTypeRepository.save(type);
    }

    private List<Room> seedRooms(Map<String, RoomType> types) {
        RoomType standard = types.get("Standard");
        RoomType deluxe = types.get("Deluxe");
        RoomType suite = types.get("Suite");

        // 9 Standard, 6 Deluxe, 3 Suite, distributed across 3 floors.
        Object[][] layout = {
                {"101", standard, 1}, {"102", standard, 1}, {"103", standard, 1}, {"104", standard, 1},
                {"105", deluxe, 1}, {"106", deluxe, 1},
                {"201", standard, 2}, {"202", standard, 2}, {"203", standard, 2},
                {"204", deluxe, 2}, {"205", deluxe, 2}, {"206", suite, 2},
                {"301", standard, 3}, {"302", standard, 3},
                {"303", deluxe, 3}, {"304", deluxe, 3},
                {"305", suite, 3}, {"306", suite, 3}};

        List<Room> rooms = new ArrayList<>(layout.length);
        for (Object[] row : layout) {
            rooms.add(upsertRoom((String) row[0], (RoomType) row[1], (Integer) row[2]));
        }
        return rooms;
    }

    private List<Room> seedStableDemoSearchInventory() {
        RoomType standard = upsertRoomType("Demo Standard", new BigDecimal("430.00"), 2,
                "WiFi, Smart TV, Breakfast",
                "Stable demo inventory for quick front-desk walkthroughs.");
        RoomType deluxe = upsertRoomType("Demo Deluxe", new BigDecimal("690.00"), 3,
                "WiFi, Smart TV, Coffee Station, City View",
                "Mid-tier demo inventory for booking and modification flows.");
        RoomType suite = upsertRoomType("Demo Suite", new BigDecimal("980.00"), 4,
                "WiFi, Smart TV, Lounge Area, Balcony",
                "Premium demo inventory kept open for same-day availability searches.");

        return List.of(
                upsertRoom("D101", standard, 1),
                upsertRoom("D102", standard, 1),
                upsertRoom("D201", deluxe, 2),
                upsertRoom("D202", deluxe, 2),
                upsertRoom("D301", suite, 3),
                upsertRoom("D302", standard, 3));
    }

    private Room upsertRoom(String number, RoomType type, int floor) {
        Room room = roomRepository.findByRoomNumber(number).orElseGet(Room::new);
        room.setRoomNumber(number);
        room.setRoomType(type);
        room.setFloor(floor);
        room.setStatus(RoomStatus.AVAILABLE);
        return roomRepository.save(room);
    }

    private void cleanupKnownLocalDemoClutter() {
        int removed = 0;
        String staleRoomReservationSubquery = """
                SELECT res.id
                FROM reservations res
                JOIN rooms room ON room.id = res.room_id
                WHERE room.room_number LIKE 'AI-%'
                   OR room.room_number LIKE '981%'
                   OR res.confirmation_number LIKE 'AI-DEMO-%'
                """;
        removed += jdbcTemplate.update("""
                DELETE FROM payments
                WHERE reservation_id IN (""" + staleRoomReservationSubquery + ")");
        removed += jdbcTemplate.update("""
                DELETE FROM invoice
                WHERE confirmation_number IN (
                    SELECT confirmation_number FROM reservations WHERE id IN (""" + staleRoomReservationSubquery + "))");
        removed += jdbcTemplate.update("""
                DELETE FROM guest_conversation_messages
                WHERE service_request_id IN (
                    SELECT req.id
                    FROM service_requests req
                    JOIN rooms room ON room.id = req.room_id
                    WHERE room.room_number LIKE 'AI-%'
                       OR room.room_number LIKE '981%'
                )
                """);
        removed += jdbcTemplate.update("""
                DELETE FROM guest_conversations
                WHERE service_request_id IN (
                    SELECT req.id
                    FROM service_requests req
                    JOIN rooms room ON room.id = req.room_id
                    WHERE room.room_number LIKE 'AI-%'
                       OR room.room_number LIKE '981%'
                )
                   OR reservation_id IN (""" + staleRoomReservationSubquery + ")");
        removed += jdbcTemplate.update("""
                DELETE FROM service_requests
                WHERE room_id IN (
                    SELECT id FROM rooms WHERE room_number LIKE 'AI-%' OR room_number LIKE '981%'
                )
                """);
        removed += jdbcTemplate.update("""
                DELETE FROM service_charges
                WHERE reservation_id IN (""" + staleRoomReservationSubquery + ")");
        removed += jdbcTemplate.update("""
                DELETE FROM reservation_audits
                WHERE reservation_id IN (""" + staleRoomReservationSubquery + ")");
        removed += jdbcTemplate.update("""
                DELETE FROM reservation_history
                WHERE reservation_id IN (""" + staleRoomReservationSubquery + ")");
        removed += jdbcTemplate.update("DELETE FROM reservations WHERE id IN (" + staleRoomReservationSubquery + ")");
        removed += jdbcTemplate.update("DELETE FROM expenses WHERE receipt_file_name LIKE 'AI-DEMO-%'");
        removed += jdbcTemplate.update("DELETE FROM rooms WHERE room_number LIKE 'AI-%'");
        removed += jdbcTemplate.update("DELETE FROM guests WHERE id_number LIKE 'AI-DEMO-GUEST-%'");
        removed += jdbcTemplate.update("DELETE FROM rooms WHERE room_number LIKE '981%'");
        removed += jdbcTemplate.update("DELETE FROM room_types WHERE name LIKE 'VERIFY-TYPE-%'");

        if (removed > 0) {
            log.info("Removed {} stale local demo/test records so the intended Roomify demo data is visible.", removed);
        }
    }

    private void seedMissingPageDemoData(LocalDate today) {
        int serviceRequests = seedDemoServiceRequests(today);
        int conversations = seedDemoGuestConversations(today);
        int templates = seedDemoServiceUsageTemplates();
        int usageRecords = seedDemoServiceUsageRecords(today);

        if (serviceRequests + conversations + templates + usageRecords > 0) {
            log.info("Filled missing page demo data: serviceRequests={}, conversations={}, serviceUsageTemplates={}, serviceUsageRecords={}.",
                    serviceRequests, conversations, templates, usageRecords);
        }
    }

    private int seedDemoServiceRequests(LocalDate today) {
        Integer existing = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM service_requests", Integer.class);
        if (existing != null && existing > 0) {
            return 0;
        }

        Long guestId = queryLong("SELECT id FROM guests WHERE lower(email) = lower(?)", DEMO_GUEST_EMAIL);
        if (guestId == null) {
            return 0;
        }

        Object[][] requests = {
                {"D101", "ROOM_CLEANING", "HIGH", "PENDING", "Please refresh towels and bottled water before dinner.", today.atTime(9, 15)},
                {"D201", "FOOD_DELIVERY", "MEDIUM", "IN_PROGRESS", "Breakfast tray requested for 8:30 AM.", today.minusDays(1).atTime(21, 35)},
                {"D301", "MAINTENANCE", "HIGH", "PENDING", "Air conditioning is not cooling consistently.", today.atTime(15, 20).minusHours(2)},
                {"D102", "LAUNDRY", "LOW", "COMPLETED", "Two shirts and one jacket for express laundry.", today.minusDays(2).atTime(10, 5)}
        };

        int inserted = 0;
        for (Object[] request : requests) {
            Long roomId = queryLong("SELECT id FROM rooms WHERE room_number = ?", request[0]);
            if (roomId == null) {
                continue;
            }
            inserted += jdbcTemplate.update("""
                    INSERT INTO service_requests
                        (guest_id, room_id, service_type, description, priority, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    guestId, roomId, request[1], request[4], request[2], request[3], request[5]);
        }
        return inserted;
    }

    private int seedDemoGuestConversations(LocalDate today) {
        Integer existing = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM guest_conversations", Integer.class);
        if (existing != null && existing > 0) {
            return 0;
        }

        Long guestId = queryLong("SELECT id FROM guests WHERE lower(email) = lower(?)", DEMO_GUEST_EMAIL);
        Long staffUserId = queryLong("SELECT id FROM users WHERE lower(email) = lower(?)", DEMO_STAFF_EMAIL);
        Long reservationId = queryLong("SELECT id FROM reservations WHERE confirmation_number = ?", DEMO_GUEST_CONFIRMATION);
        Long serviceRequestId = queryLong("SELECT id FROM service_requests ORDER BY created_at DESC LIMIT 1");
        Long roomId = queryLong("SELECT room_id FROM reservations WHERE id = ?", reservationId);
        if (guestId == null || roomId == null) {
            return 0;
        }

        Long activeConversationId = insertConversation(
                guestId,
                reservationId,
                roomId,
                serviceRequestId,
                staffUserId,
                "Towels and room refresh",
                "ACTIVE",
                "Extra towels are on the way.",
                today.atTime(12, 40),
                0,
                1);
        insertMessage(activeConversationId, "GUEST", null, guestId, serviceRequestId,
                "Could we get extra towels and water bottles?", "en",
                "هل يمكننا الحصول على مناشف إضافية وزجاجات ماء؟",
                "Could we get extra towels and water bottles?",
                false,
                "HOUSEKEEPING",
                today.atTime(12, 24));
        insertMessage(activeConversationId, "STAFF", staffUserId, null, serviceRequestId,
                "Extra towels are on the way.", "en",
                "المناشف الإضافية في الطريق.",
                "Extra towels are on the way.",
                false,
                null,
                today.atTime(12, 40));

        Long aiConversationId = insertConversation(
                guestId,
                reservationId,
                roomId,
                null,
                staffUserId,
                "Restaurant recommendation",
                "PENDING",
                "I can recommend our rooftop restaurant for dinner tonight.",
                today.minusDays(1).atTime(18, 10),
                0,
                1);
        insertMessage(aiConversationId, "GUEST", null, guestId, null,
                "What is a good dinner option at the hotel?", "en",
                "ما هو خيار العشاء الجيد في الفندق؟",
                "What is a good dinner option at the hotel?",
                false,
                "RESTAURANT",
                today.minusDays(1).atTime(18, 3));
        insertMessage(aiConversationId, "AI", null, null, null,
                "I can recommend our rooftop restaurant for dinner tonight.", "en",
                "يمكنني ترشيح مطعم السطح لدينا لعشاء الليلة.",
                "I can recommend our rooftop restaurant for dinner tonight.",
                true,
                "ASK_AI",
                today.minusDays(1).atTime(18, 10));

        return 2;
    }

    private Long insertConversation(
            Long guestId,
            Long reservationId,
            Long roomId,
            Long serviceRequestId,
            Long staffUserId,
            String subject,
            String status,
            String preview,
            LocalDateTime lastMessageAt,
            int unreadGuestCount,
            int unreadStaffCount) {
        return insertAndReturnId("""
                INSERT INTO guest_conversations
                    (public_id, guest_id, reservation_id, room_id, service_request_id, assigned_staff_user_id,
                     status, subject, preferred_language, ai_fallback_enabled, ai_handled,
                     unread_guest_count, unread_staff_count, last_message_preview, last_message_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en', true, false, ?, ?, ?, ?, ?, ?)
                """,
                UUID.randomUUID(), guestId, reservationId, roomId, serviceRequestId, staffUserId,
                status, subject, unreadGuestCount, unreadStaffCount, preview, lastMessageAt, lastMessageAt, lastMessageAt);
    }

    private void insertMessage(
            Long conversationId,
            String senderRole,
            Long senderUserId,
            Long senderGuestId,
            Long serviceRequestId,
            String originalBody,
            String detectedLanguage,
            String arabicTranslation,
            String englishTranslation,
            boolean aiGenerated,
            String quickActionType,
            LocalDateTime createdAt) {
        jdbcTemplate.update("""
                INSERT INTO guest_conversation_messages
                    (conversation_id, sender_role, sender_user_id, sender_guest_id, service_request_id,
                     message_status, original_body, detected_language, arabic_translation, english_translation,
                     guest_localized_body, guest_localized_language, ai_generated, quick_action_type,
                     delivered_at, created_at)
                VALUES (?, ?, ?, ?, ?, 'DELIVERED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                conversationId, senderRole, senderUserId, senderGuestId, serviceRequestId,
                originalBody, detectedLanguage, arabicTranslation, englishTranslation,
                originalBody, detectedLanguage, aiGenerated, quickActionType, createdAt, createdAt);
    }

    private int seedDemoServiceUsageTemplates() {
        Integer existing = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM service_usage_templates", Integer.class);
        if (existing != null && existing > 0) {
            return 0;
        }

        Long standardTypeId = queryLong("SELECT id FROM room_types WHERE name = ?", "Demo Standard");
        Long deluxeTypeId = queryLong("SELECT id FROM room_types WHERE name = ?", "Demo Deluxe");

        Long towelId = queryLong("SELECT id FROM inventory_items WHERE name = ?", "Bath towels (large)");
        Long waterId = queryLong("SELECT id FROM inventory_items WHERE name = ?", "Bottled water (500ml)");
        Long shampooId = queryLong("SELECT id FROM inventory_items WHERE name = ?", "Shampoo bottles (200ml)");
        Long solutionId = queryLong("SELECT id FROM inventory_items WHERE name = ?", "Cleaning solution (5L)");
        Long linenId = queryLong("SELECT id FROM inventory_items WHERE name = ?", "Bed linens (queen)");
        if (towelId == null || waterId == null || shampooId == null || solutionId == null || linenId == null) {
            return 0;
        }

        Long standardTemplateId = insertUsageTemplate(
                "Demo Standard Room Turnover",
                "STANDARD_ROOM_CLEANING",
                standardTypeId,
                "Default cleaning bundle for demo standard rooms.");
        insertTemplateItem(standardTemplateId, towelId, "2.000", "Two large towels");
        insertTemplateItem(standardTemplateId, waterId, "2.000", "Welcome waters");
        insertTemplateItem(standardTemplateId, shampooId, "1.000", "Bathroom amenity");
        insertTemplateItem(standardTemplateId, solutionId, "0.150", "Cleaning allocation");

        Long deluxeTemplateId = insertUsageTemplate(
                "Demo Deluxe Checkout Cleaning",
                "CHECKOUT_CLEANING",
                deluxeTypeId,
                "Checkout cleaning bundle for demo deluxe rooms.");
        insertTemplateItem(deluxeTemplateId, towelId, "3.000", "Towel replacement");
        insertTemplateItem(deluxeTemplateId, linenId, "1.000", "Fresh queen linens");
        insertTemplateItem(deluxeTemplateId, waterId, "2.000", "Welcome waters");
        insertTemplateItem(deluxeTemplateId, solutionId, "0.250", "Deep cleaning allocation");

        return 2;
    }

    private Long insertUsageTemplate(String name, String serviceType, Long roomTypeId, String notes) {
        LocalDateTime now = LocalDateTime.now();
        return insertAndReturnId("""
                INSERT INTO service_usage_templates
                    (name, service_type, room_type_id, active, notes, created_at, updated_at)
                VALUES (?, ?, ?, true, ?, ?, ?)
                """,
                name, serviceType, roomTypeId, notes, now, now);
    }

    private void insertTemplateItem(Long templateId, Long itemId, String quantity, String notes) {
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update("""
                INSERT INTO service_usage_template_items
                    (template_id, inventory_item_id, standard_quantity, active, notes, created_at, updated_at)
                VALUES (?, ?, ?, true, ?, ?, ?)
                """,
                templateId, itemId, new BigDecimal(quantity), notes, now, now);
    }

    private int seedDemoServiceUsageRecords(LocalDate today) {
        Integer existing = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM service_usage_records", Integer.class);
        if (existing != null && existing > 0) {
            return 0;
        }

        Long actorId = queryLong("SELECT id FROM users WHERE lower(email) = lower(?)", DEMO_STAFF_EMAIL);
        List<Long> templateIds = jdbcTemplate.queryForList(
                "SELECT id FROM service_usage_templates ORDER BY id LIMIT 2",
                Long.class);
        if (templateIds.isEmpty()) {
            return 0;
        }

        String[][] rooms = {
                {"D101", "STANDARD_ROOM_CLEANING", "AVAILABLE", "Routine morning refresh"},
                {"D201", "CHECKOUT_CLEANING", "AVAILABLE", "Checkout reset completed"},
                {"D301", "DEEP_CLEANING", "AVAILABLE", "Suite deep clean after extended stay"}
        };

        int inserted = 0;
        for (int i = 0; i < rooms.length; i++) {
            Long roomId = queryLong("SELECT id FROM rooms WHERE room_number = ?", rooms[i][0]);
            Long roomTypeId = queryLong("SELECT room_type_id FROM rooms WHERE id = ?", roomId);
            Long templateId = templateIds.get(Math.min(i, templateIds.size() - 1));
            if (roomId == null || roomTypeId == null) {
                continue;
            }

            LocalDateTime performedAt = today.minusDays(i).atTime(11 + i, 15);
            Long recordId = insertAndReturnId("""
                    INSERT INTO service_usage_records
                        (room_id, room_type_id, service_type, template_id, applied_standard_template,
                         source_room_status, service_date, performed_at, total_cost, notes,
                         created_by_user_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, true, ?, ?, ?, 0.00, ?, ?, ?, ?)
                    """,
                    roomId, roomTypeId, rooms[i][1], templateId, rooms[i][2],
                    performedAt.toLocalDate(), performedAt, rooms[i][3], actorId, performedAt, performedAt);

            BigDecimal total = copyTemplateItemsToUsageRecord(recordId, templateId);
            jdbcTemplate.update("UPDATE service_usage_records SET total_cost = ? WHERE id = ?", total, recordId);
            inserted++;
        }
        return inserted;
    }

    private Long insertAndReturnId(String sql, Object... args) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) {
                statement.setObject(i + 1, args[i]);
            }
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Insert did not return a generated id.");
        }
        return key.longValue();
    }

    private BigDecimal copyTemplateItemsToUsageRecord(Long recordId, Long templateId) {
        List<Map<String, Object>> items = jdbcTemplate.queryForList("""
                SELECT ti.id AS template_item_id,
                       ti.inventory_item_id,
                       ti.standard_quantity,
                       ii.default_unit_cost
                FROM service_usage_template_items ti
                JOIN inventory_items ii ON ii.id = ti.inventory_item_id
                WHERE ti.template_id = ?
                ORDER BY ti.id
                """,
                templateId);

        BigDecimal total = BigDecimal.ZERO;
        LocalDateTime now = LocalDateTime.now();
        for (Map<String, Object> item : items) {
            BigDecimal quantity = (BigDecimal) item.get("standard_quantity");
            BigDecimal unitCost = (BigDecimal) item.get("default_unit_cost");
            BigDecimal lineTotal = quantity.multiply(unitCost).setScale(2, java.math.RoundingMode.HALF_UP);
            total = total.add(lineTotal);
            jdbcTemplate.update("""
                    INSERT INTO service_usage_record_items
                        (usage_record_id, inventory_item_id, template_item_id, standard_quantity,
                         actual_quantity, unit_cost, total_cost, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Seeded demo consumption', ?, ?)
                    """,
                    recordId,
                    item.get("inventory_item_id"),
                    item.get("template_item_id"),
                    quantity,
                    quantity,
                    unitCost,
                    lineTotal,
                    now,
                    now);
        }
        return total;
    }

    private Long queryLong(String sql, Object... args) {
        List<Long> values = jdbcTemplate.queryForList(sql, Long.class, args);
        return values.isEmpty() ? null : values.get(0);
    }

    // ─── Guests ─────────────────────────────────────────────────────────────

    private Guest upsertDemoGuestRecord() {
        Guest guest = guestRepository.findByEmailIgnoreCase(DEMO_GUEST_EMAIL).orElseGet(Guest::new);
        guest.setName("Demo Guest");
        guest.setEmail(DEMO_GUEST_EMAIL);
        guest.setPhone("+966500000111");
        guest.setIdNumber("ROOMIFY-DEMO-GUEST-LOGIN");
        guest.setNationality("SA");
        return guestRepository.save(guest);
    }

    private void seedDemoGuestReservationIfPossible(LocalDate today) {
        if (reservationRepository.existsByConfirmationNumber(DEMO_GUEST_CONFIRMATION)) {
            return;
        }

        Optional<Room> room = roomRepository.findByRoomNumber("306");
        if (room.isEmpty()) {
            return;
        }

        Guest demoGuest = upsertDemoGuestRecord();
        saveScripted(
                DEMO_GUEST_CONFIRMATION,
                demoGuest,
                room.get(),
                today.plusDays(10),
                today.plusDays(12),
                ReservationStatus.CONFIRMED);
    }

    private static final String[] AR_FIRST_NAMES = {
            "Mohammed", "Abdullah", "Ali", "Khalid", "Faisal", "Omar", "Yousef", "Saud", "Bandar", "Majed",
            "Fatima", "Noura", "Sara", "Reem", "Layla", "Aisha", "Hala", "Maha", "Lina", "Dalal",
            "Hassan", "Ibrahim", "Nasser", "Salman", "Ahmed"};
    private static final String[] AR_LAST_NAMES = {
            "Al-Otaibi", "Al-Shammari", "Al-Qahtani", "Al-Dosari", "Al-Ghamdi",
            "Al-Harbi", "Al-Mutairi", "Al-Subaie", "Al-Zahrani", "Al-Rashid"};

    private static final String[][] INT_GUESTS = {
            {"Daniel", "Rodriguez", "US"}, {"Priya", "Iyer", "IN"}, {"Hannah", "O'Brien", "GB"},
            {"Hiroshi", "Tanaka", "JP"}, {"Elena", "Volkov", "RU"}, {"Layla", "Marchetti", "IT"},
            {"James", "Carter", "US"}, {"Sophie", "Laurent", "FR"}, {"Aleksandar", "Petrov", "RU"},
            {"Yuki", "Nakamura", "JP"}, {"Mia", "Andersson", "SE"}, {"Lukas", "Weber", "DE"},
            {"Aarav", "Sharma", "IN"}, {"Chloe", "Dubois", "FR"}, {"David", "Kim", "KR"}};

    private List<Guest> seedGuests() {
        List<Guest> guests = new ArrayList<>(TARGET_GUEST_COUNT);
        int sequence = 1;

        for (int i = 0; i < 25; i++) {
            String first = AR_FIRST_NAMES[i % AR_FIRST_NAMES.length];
            String last = AR_LAST_NAMES[i % AR_LAST_NAMES.length];
            guests.add(buildGuest(first, last, "SA", sequence++));
        }
        for (String[] entry : INT_GUESTS) {
            guests.add(buildGuest(entry[0], entry[1], entry[2], sequence++));
        }
        return guestRepository.saveAll(guests);
    }

    private Guest buildGuest(String firstName, String lastName, String nationality, int sequence) {
        String email = (firstName + "." + lastName.replace("'", "").replace("-", ""))
                .toLowerCase(Locale.ROOT) + sequence + "@example.com";
        String idNumber = "NDB-" + String.format(Locale.ROOT, "%06d", sequence);
        Guest existing = guestRepository.findByEmailIgnoreCase(email).orElse(null);
        Guest guest = existing != null ? existing : new Guest();
        guest.setName(firstName + " " + lastName);
        guest.setEmail(email);
        guest.setPhone("+9665" + String.format(Locale.ROOT, "%08d", 10_000_000 + sequence));
        guest.setIdNumber(idNumber);
        guest.setNationality(nationality);
        return guest;
    }

    // ─── Reservations ───────────────────────────────────────────────────────

    /**
     * Saudi event windows for 2024-2026, used as multipliers on the base daily
     * weight when picking historical check-in dates. Gregorian approximations
     * of Hijri events — good enough for a demo, no Hijri library needed.
     */
    private static final List<EventWindow> EVENT_WINDOWS = List.of(
            new EventWindow(LocalDate.of(2024, 3, 11), LocalDate.of(2024, 4, 9), 1.3, "Ramadan 2024"),
            new EventWindow(LocalDate.of(2024, 4, 10), LocalDate.of(2024, 4, 14), 3.5, "Eid Al-Fitr 2024"),
            new EventWindow(LocalDate.of(2024, 6, 14), LocalDate.of(2024, 6, 19), 2.5, "Hajj 2024"),
            new EventWindow(LocalDate.of(2024, 6, 16), LocalDate.of(2024, 6, 20), 3.5, "Eid Al-Adha 2024"),
            new EventWindow(LocalDate.of(2024, 9, 21), LocalDate.of(2024, 9, 25), 2.8, "Saudi National Day 2024"),
            new EventWindow(LocalDate.of(2024, 6, 20), LocalDate.of(2024, 8, 31), 1.8, "Summer break 2024"),
            new EventWindow(LocalDate.of(2024, 12, 15), LocalDate.of(2025, 1, 5), 1.6, "Winter break 2024/25"),

            new EventWindow(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 29), 1.3, "Ramadan 2025"),
            new EventWindow(LocalDate.of(2025, 3, 30), LocalDate.of(2025, 4, 3), 3.5, "Eid Al-Fitr 2025"),
            new EventWindow(LocalDate.of(2025, 6, 4), LocalDate.of(2025, 6, 9), 2.5, "Hajj 2025"),
            new EventWindow(LocalDate.of(2025, 6, 6), LocalDate.of(2025, 6, 10), 3.5, "Eid Al-Adha 2025"),
            new EventWindow(LocalDate.of(2025, 9, 21), LocalDate.of(2025, 9, 25), 2.8, "Saudi National Day 2025"),
            new EventWindow(LocalDate.of(2025, 6, 20), LocalDate.of(2025, 8, 31), 1.8, "Summer break 2025"),
            new EventWindow(LocalDate.of(2025, 12, 15), LocalDate.of(2026, 1, 5), 1.6, "Winter break 2025/26"),

            new EventWindow(LocalDate.of(2026, 2, 18), LocalDate.of(2026, 3, 19), 1.3, "Ramadan 2026"),
            new EventWindow(LocalDate.of(2026, 3, 20), LocalDate.of(2026, 3, 24), 3.5, "Eid Al-Fitr 2026"),
            new EventWindow(LocalDate.of(2026, 5, 25), LocalDate.of(2026, 5, 30), 2.5, "Hajj 2026"),
            new EventWindow(LocalDate.of(2026, 5, 27), LocalDate.of(2026, 5, 31), 3.5, "Eid Al-Adha 2026"));

    private SeedReport seedReservations(LocalDate today, List<Room> rooms, List<Guest> guests, Guest demoGuest, Random random) {
        Map<Long, List<DateRange>> occupied = new HashMap<>();
        List<Reservation> created = new ArrayList<>();

        // 1. Current CHECKED_IN: 8 reservations. At least 2 must have checkOutDate = today.
        for (int i = 0; i < TARGET_CHECKED_IN; i++) {
            boolean checkoutToday = i < 2;
            int stayLength = 2 + random.nextInt(4);
            LocalDate checkIn = checkoutToday ? today.minusDays(stayLength) : today.minusDays(random.nextInt(stayLength));
            LocalDate checkOut = checkoutToday ? today : today.plusDays(1 + random.nextInt(3));
            if (!checkOut.isAfter(checkIn)) {
                checkOut = checkIn.plusDays(1);
            }
            Reservation r = placeReservation(rooms, occupied, pickGuest(guests, random),
                    checkIn, checkOut, ReservationStatus.CHECKED_IN, nextConfirmation(random), random);
            if (r != null) {
                r.setActualCheckInDate(checkIn);
                created.add(r);
            }
        }

        // 2. Future window: 28 CONFIRMED (≥3 with checkInDate = today) + 4 PENDING.
        int sameDayCheckins = 0;
        int confirmedPlaced = 0;
        int attempts = 0;
        while (confirmedPlaced < TARGET_CONFIRMED_FUTURE && attempts < 500) {
            attempts++;
            boolean forceToday = sameDayCheckins < 3;
            LocalDate checkIn = forceToday ? today : today.plusDays(1 + random.nextInt(FUTURE_WINDOW_DAYS));
            int stayLength = pickStayLength(random);
            LocalDate checkOut = checkIn.plusDays(stayLength);
            Reservation r = placeReservation(rooms, occupied, pickGuest(guests, random),
                    checkIn, checkOut, ReservationStatus.CONFIRMED, nextConfirmation(random), random);
            if (r != null) {
                created.add(r);
                confirmedPlaced++;
                if (checkIn.equals(today)) {
                    sameDayCheckins++;
                }
            }
        }

        for (int i = 0; i < TARGET_PENDING_FUTURE; i++) {
            LocalDate checkIn = today.plusDays(5 + random.nextInt(FUTURE_WINDOW_DAYS - 5));
            int stayLength = pickStayLength(random);
            LocalDate checkOut = checkIn.plusDays(stayLength);
            Reservation r = placeReservation(rooms, occupied, pickGuest(guests, random),
                    checkIn, checkOut, ReservationStatus.PENDING, nextConfirmation(random), random);
            if (r != null) {
                created.add(r);
            }
        }

        // 3. Forced overlap pair on the same room (Room Grid 409 conflict demo).
        Reservation overlapBase = created.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED && r.getCheckInDate().isAfter(today.plusDays(2)))
                .findFirst().orElse(null);
        if (overlapBase != null) {
            LocalDate overlapIn = overlapBase.getCheckInDate().plusDays(1);
            LocalDate overlapOut = overlapBase.getCheckOutDate().plusDays(1);
            Reservation overlap = new Reservation();
            overlap.setGuest(pickGuest(guests, random));
            overlap.setRoom(overlapBase.getRoom());
            overlap.setCheckInDate(overlapIn);
            overlap.setCheckOutDate(overlapOut);
            overlap.setStatus(ReservationStatus.CONFIRMED);
            overlap.setConfirmationNumber(nextConfirmation(random));
            overlap.setCreatedAt(LocalDateTime.now());
            overlap.setModifiedAt(LocalDateTime.now());
            overlap.setTotalPrice(BigDecimal.ZERO);
            overlap.setTotalPaid(BigDecimal.ZERO);
            overlap.setOutstandingBalance(BigDecimal.ZERO);
            overlap.setPaymentStatus(PaymentStatus.PENDING);
            reservationFinancialService.syncReservation(overlap);
            reservationRepository.save(overlap);
            created.add(overlap);
            // Intentionally NOT added to occupied map — we want the conflict to remain.
        }

        // 4. Past reservations across 2 years with seasonality weighting.
        LocalDate historyStart = today.minusDays(PAST_HISTORY_DAYS);
        LocalDate historyEnd = today.minusDays(1);
        double[] dailyWeights = computeDailyWeights(historyStart, historyEnd, today);
        int placed = 0;
        attempts = 0;
        while (placed < TARGET_PAST_RESERVATIONS && attempts < TARGET_PAST_RESERVATIONS * 30) {
            attempts++;
            LocalDate checkIn = sampleWeightedDate(historyStart, dailyWeights, random);
            int stayLength = pickStayLength(random);
            LocalDate checkOut = checkIn.plusDays(stayLength);
            if (!checkOut.isBefore(today)) {
                continue; // ensure fully in the past
            }
            ReservationStatus status = pickPastStatus(random);
            Reservation r = placeReservation(rooms, occupied, pickGuest(guests, random),
                    checkIn, checkOut, status, nextConfirmation(random), random);
            if (r != null) {
                if (status == ReservationStatus.CHECKED_OUT) {
                    r.setActualCheckInDate(checkIn);
                    r.setActualCheckOutAt(checkOut.atTime(11, 0));
                } else if (status == ReservationStatus.CANCELLED) {
                    r.setCancellationReason(random.nextInt(4) == 0
                            ? "Guest no-show"
                            : "Guest requested cancellation");
                    r.setCancellationAt(checkIn.minusDays(1).atTime(9, 0));
                }
                created.add(r);
                placed++;
            }
        }

        // 5. Preserve scripted demo reservations attached to demoGuest.
        seedScriptedReservations(today, rooms, demoGuest, created);

        Map<ReservationStatus, List<Reservation>> byStatus = new HashMap<>();
        for (Reservation r : created) {
            byStatus.computeIfAbsent(r.getStatus(), k -> new ArrayList<>()).add(r);
        }

        Map<Month, Integer> monthCounts = new TreeMap<>();
        for (Reservation r : created) {
            monthCounts.merge(r.getCheckInDate().getMonth(), 1, Integer::sum);
        }
        return new SeedReport(created, byStatus, monthCounts);
    }

    private void seedScriptedReservations(LocalDate today, List<Room> rooms, Guest demoGuest, List<Reservation> sink) {
        Room r101 = roomByNumber(rooms, "101");
        Room r102 = roomByNumber(rooms, "102");
        Room r201 = roomByNumber(rooms, "201");
        Room r202 = roomByNumber(rooms, "202");
        Room r301 = roomByNumber(rooms, "301");

        sink.add(saveScripted("DEMO-CHECKIN-READY", demoGuest, r101, today, today.plusDays(1), ReservationStatus.CONFIRMED));
        sink.add(saveScripted("DEMO-CHECKIN-BLOCKED", demoGuest, r102, today.plusDays(1), today.plusDays(2), ReservationStatus.CONFIRMED));
        sink.add(saveScripted("DEMO-CANCEL", demoGuest, r201, today.plusDays(3), today.plusDays(5), ReservationStatus.PENDING));
        sink.add(saveScripted("DEMO-MODIFY", demoGuest, r202, today.plusDays(5), today.plusDays(7), ReservationStatus.CONFIRMED));
        sink.add(saveScripted("DEMO-MODIFY-CONFLICT", demoGuest, r301, today.plusDays(6), today.plusDays(8), ReservationStatus.CONFIRMED));
    }

    private Reservation saveScripted(String confirmation, Guest guest, Room room, LocalDate in, LocalDate out, ReservationStatus status) {
        Reservation r = reservationRepository.findByConfirmationNumber(confirmation).orElseGet(Reservation::new);
        r.setGuest(guest);
        r.setRoom(room);
        r.setCheckInDate(in);
        r.setCheckOutDate(out);
        r.setStatus(status);
        r.setConfirmationNumber(confirmation);
        r.setTotalPrice(BigDecimal.ZERO);
        r.setTotalPaid(BigDecimal.ZERO);
        r.setOutstandingBalance(BigDecimal.ZERO);
        r.setPaymentStatus(PaymentStatus.PENDING);
        r.setInvoiceFinalized(false);
        reservationFinancialService.syncReservation(r);
        return reservationRepository.save(r);
    }

    private Room roomByNumber(List<Room> rooms, String number) {
        return rooms.stream().filter(r -> r.getRoomNumber().equals(number)).findFirst().orElseThrow();
    }

    private Reservation placeReservation(
            List<Room> rooms,
            Map<Long, List<DateRange>> occupied,
            Guest guest,
            LocalDate checkIn,
            LocalDate checkOut,
            ReservationStatus status,
            String confirmation,
            Random random) {
        for (int attempt = 0; attempt < 5; attempt++) {
            Room room = rooms.get(random.nextInt(rooms.size()));
            if (!hasOverlap(occupied, room.getId(), checkIn, checkOut)) {
                Reservation r = new Reservation();
                r.setGuest(guest);
                r.setRoom(room);
                r.setCheckInDate(checkIn);
                r.setCheckOutDate(checkOut);
                r.setStatus(status);
                r.setConfirmationNumber(confirmation);
                r.setTotalPrice(BigDecimal.ZERO);
                r.setTotalPaid(BigDecimal.ZERO);
                r.setOutstandingBalance(BigDecimal.ZERO);
                r.setPaymentStatus(PaymentStatus.PENDING);
                r.setCreatedAt(checkIn.minusDays(7L + random.nextInt(60)).atTime(9 + random.nextInt(8), random.nextInt(60)));
                r.setModifiedAt(r.getCreatedAt());
                reservationFinancialService.syncReservation(r);
                Reservation saved = reservationRepository.save(r);
                if (status != ReservationStatus.CANCELLED) {
                    occupied.computeIfAbsent(room.getId(), k -> new ArrayList<>()).add(new DateRange(checkIn, checkOut));
                }
                return saved;
            }
        }
        return null;
    }

    private boolean hasOverlap(Map<Long, List<DateRange>> occupied, Long roomId, LocalDate in, LocalDate out) {
        List<DateRange> ranges = occupied.get(roomId);
        if (ranges == null) return false;
        for (DateRange dr : ranges) {
            if (dr.start().isBefore(out) && dr.end().isAfter(in)) return true;
        }
        return false;
    }

    private Guest pickGuest(List<Guest> guests, Random random) {
        // Power-law-ish weighting: first 15 guests are loyal customers (most picks),
        // remaining 25 get 2-5 reservations each on average.
        if (random.nextDouble() < 0.62d) {
            return guests.get(random.nextInt(Math.min(15, guests.size())));
        }
        return guests.get(15 + random.nextInt(guests.size() - 15));
    }

    private int pickStayLength(Random random) {
        int roll = random.nextInt(100);
        if (roll < 15) return 1;
        if (roll < 45) return 2;
        if (roll < 70) return 3;
        if (roll < 85) return 4;
        return 5 + random.nextInt(3); // 5-7
    }

    private ReservationStatus pickPastStatus(Random random) {
        int roll = random.nextInt(100);
        if (roll < 79) return ReservationStatus.CHECKED_OUT;
        if (roll < 94) return ReservationStatus.CANCELLED;
        // ReservationStatus has no NO_SHOW; brief's NO_SHOW count is folded into CANCELLED.
        return ReservationStatus.CANCELLED;
    }

    private String nextConfirmation(Random random) {
        char[] chars = new char[6];
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int i = 0; i < 6; i++) {
            chars[i] = alphabet.charAt(random.nextInt(alphabet.length()));
        }
        String candidate = "RX-" + new String(chars);
        if (reservationRepository.existsByConfirmationNumber(candidate)) {
            return nextConfirmation(random);
        }
        return candidate;
    }

    private double[] computeDailyWeights(LocalDate start, LocalDate end, LocalDate today) {
        int days = (int) (end.toEpochDay() - start.toEpochDay() + 1);
        double[] weights = new double[days];
        for (int i = 0; i < days; i++) {
            LocalDate d = start.plusDays(i);
            double weekly = (d.getDayOfWeek() == DayOfWeek.THURSDAY
                    || d.getDayOfWeek() == DayOfWeek.FRIDAY
                    || d.getDayOfWeek() == DayOfWeek.SATURDAY) ? 2.0 : 1.0;
            double event = eventMultiplier(d);
            double trend = computeTrendWeight(d, today);
            weights[i] = weekly * event * trend;
        }
        return weights;
    }

    private double eventMultiplier(LocalDate d) {
        double best = 1.0;
        boolean inAnyEvent = false;
        for (EventWindow w : EVENT_WINDOWS) {
            if (!d.isBefore(w.start()) && !d.isAfter(w.end())) {
                inAnyEvent = true;
                if (w.multiplier() > best) {
                    best = w.multiplier();
                }
            }
        }
        if (!inAnyEvent) {
            Month m = d.getMonth();
            if (m == Month.JANUARY || m == Month.FEBRUARY
                    || m == Month.SEPTEMBER || m == Month.OCTOBER || m == Month.NOVEMBER) {
                return 0.7;
            }
        }
        return best;
    }

    private double computeTrendWeight(LocalDate d, LocalDate today) {
        // Flattened from 0.85/1.0/1.15 to 0.95/1.0/1.05 so the older year is not
        // visually starved on the AI Finance historical chart. The brief targeted
        // a "mild year-over-year growth" signal; the steeper original weights
        // compounded with the seasonality multipliers (and with the calendar
        // accident that Ramadan/Eid Al-Fitr 2024 fall before the 730d window
        // start) to produce a 2x revenue ratio between the two halves of the
        // history, which read on screen as "the first year is almost empty".
        long daysAgo = today.toEpochDay() - d.toEpochDay();
        if (daysAgo > 365) return 0.95;
        if (daysAgo > 90) return 1.0;
        return 1.05;
    }

    private LocalDate sampleWeightedDate(LocalDate start, double[] weights, Random random) {
        double total = 0;
        for (double w : weights) total += w;
        double pick = random.nextDouble() * total;
        double running = 0;
        for (int i = 0; i < weights.length; i++) {
            running += weights[i];
            if (running >= pick) {
                return start.plusDays(i);
            }
        }
        return start.plusDays(weights.length - 1);
    }

    // ─── Payments ───────────────────────────────────────────────────────────

    private void seedPayments(List<Reservation> checkedOut, Random random) {
        List<Payment> payments = new ArrayList<>();
        for (Reservation r : checkedOut) {
            Payment p = new Payment();
            p.setReservation(r);
            p.setAmount(r.getTotalPrice());
            p.setPaymentStatus(PaymentStatus.PAID);
            PaymentMethod method = pickPaymentMethod(random);
            p.setPaymentMethod(method);
            p.setGatewayReference(method == PaymentMethod.CARD ? "DEMO-" + randomToken(random, 8) : null);
            p.setCreatedAt(r.getCheckOutDate().atTime(11, 30));
            payments.add(p);

            r.setTotalPaid(r.getTotalPrice());
            r.setOutstandingBalance(BigDecimal.ZERO);
            r.setPaymentStatus(PaymentStatus.PAID);
            r.setInvoiceFinalized(true);
        }
        paymentRepository.saveAll(payments);
        reservationRepository.saveAll(checkedOut);
    }

    private PaymentMethod pickPaymentMethod(Random random) {
        int roll = random.nextInt(100);
        if (roll < 60) return PaymentMethod.CARD;
        if (roll < 80) return PaymentMethod.CASH;
        return PaymentMethod.BANK_TRANSFER;
    }

    private String randomToken(Random random, int length) {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
        return sb.toString();
    }

    // ─── Invoices ───────────────────────────────────────────────────────────

    private void seedInvoices(List<Reservation> checkedOut, Random random) {
        List<Invoice> invoices = new ArrayList<>();
        Map<String, Integer> sequencePerYear = new HashMap<>();
        for (Reservation r : checkedOut) {
            String year = r.getCheckOutDate().format(INVOICE_YEAR_FORMAT);
            int seq = sequencePerYear.merge(year, 1, Integer::sum);
            String invoiceNumber = String.format(Locale.ROOT, "INV-%s-%06d", year, seq);

            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .confirmationNumber(r.getConfirmationNumber())
                    .pdfFileName(null)
                    .createdAt(r.getCheckOutDate().atTime(11, 45))
                    .build();
            invoices.add(invoice);

            r.setInvoiceNumber(invoiceNumber);
            r.setInvoiceFinalized(true);
        }
        invoiceRepository.saveAll(invoices);
        reservationRepository.saveAll(checkedOut);
    }

    // ─── Room status sync ───────────────────────────────────────────────────

    private void markCurrentlyOccupiedRooms(List<Reservation> checkedIn) {
        for (Reservation r : checkedIn) {
            Room room = r.getRoom();
            room.setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(room);
        }
    }

    // ─── Audit log ──────────────────────────────────────────────────────────

    /**
     * AuditLog.@PrePersist forces createdAt = LocalDateTime.now(), so we cannot
     * backdate entries via the repository. We insert directly with JdbcTemplate
     * to keep historical timestamps.
     */
    private void seedAuditLogs(User manager, List<User> staffUsers, SeedReport report, Random random) {
        List<Object[]> rows = new ArrayList<>();
        List<String> actorPool = new ArrayList<>();
        actorPool.add(DEMO_ADMIN_EMAIL);
        actorPool.add(manager.getEmail());
        for (User s : staffUsers) actorPool.add(s.getEmail());
        actorPool.add(DEMO_STAFF_EMAIL);

        for (Reservation r : report.allReservations()) {
            LocalDateTime createdAt = r.getCreatedAt() != null ? r.getCreatedAt() : r.getCheckInDate().minusDays(2).atTime(10, 0);
            rows.add(new Object[]{
                    actorPool.get(random.nextInt(actorPool.size())),
                    "RESERVATION_CREATED",
                    r.getConfirmationNumber(),
                    "{\"room\":\"" + r.getRoom().getRoomNumber() + "\"}",
                    createdAt});

            if (r.getStatus() == ReservationStatus.CHECKED_OUT) {
                rows.add(new Object[]{
                        actorPool.get(random.nextInt(actorPool.size())),
                        "RESERVATION_CHECKED_IN",
                        r.getConfirmationNumber(),
                        null,
                        r.getCheckInDate().atTime(14, 0)});
                rows.add(new Object[]{
                        actorPool.get(random.nextInt(actorPool.size())),
                        "PAYMENT_RECORDED",
                        r.getConfirmationNumber(),
                        "{\"amount\":\"" + r.getTotalPrice() + "\"}",
                        r.getCheckOutDate().atTime(11, 30)});
                rows.add(new Object[]{
                        actorPool.get(random.nextInt(actorPool.size())),
                        "RESERVATION_CHECKED_OUT",
                        r.getConfirmationNumber(),
                        null,
                        r.getCheckOutDate().atTime(11, 35)});
            } else if (r.getStatus() == ReservationStatus.CANCELLED) {
                rows.add(new Object[]{
                        actorPool.get(random.nextInt(actorPool.size())),
                        "RESERVATION_CANCELLED",
                        r.getConfirmationNumber(),
                        null,
                        r.getCancellationAt() != null ? r.getCancellationAt() : createdAt.plusDays(1)});
            } else if (r.getStatus() == ReservationStatus.CHECKED_IN) {
                rows.add(new Object[]{
                        actorPool.get(random.nextInt(actorPool.size())),
                        "RESERVATION_CHECKED_IN",
                        r.getConfirmationNumber(),
                        null,
                        r.getCheckInDate().atTime(14, 0)});
            }
        }

        jdbcTemplate.batchUpdate(
                "INSERT INTO audit_logs (actor, action, target, metadata, created_at) VALUES (?, ?, ?, ?, ?)",
                rows);
    }

    // ─── Hotel Services (B1) ────────────────────────────────────────────────

    /**
     * Eight standard hotel services. ServiceCategory enum is restricted to
     * FOOD / CLEANING / OTHER — we map dining items to FOOD, laundry to
     * CLEANING, transport/spa/room items to OTHER. The brief's richer
     * categories (TRANSPORT/WELLNESS/etc.) do not exist in this codebase.
     */
    private List<HotelService> seedHotelServices() {
        record ServiceSpec(String name, ServiceCategory category, String price) {}
        List<ServiceSpec> specs = List.of(
                new ServiceSpec("Airport Pickup", ServiceCategory.OTHER, "150.00"),
                new ServiceSpec("Airport Drop-off", ServiceCategory.OTHER, "150.00"),
                new ServiceSpec("Late Checkout (until 6pm)", ServiceCategory.OTHER, "200.00"),
                new ServiceSpec("Breakfast Buffet", ServiceCategory.FOOD, "75.00"),
                new ServiceSpec("In-room Dining (delivery fee)", ServiceCategory.FOOD, "25.00"),
                new ServiceSpec("Laundry Service (per kg)", ServiceCategory.CLEANING, "35.00"),
                new ServiceSpec("Extra Bed", ServiceCategory.OTHER, "120.00"));

        List<HotelService> existing = hotelServiceRepository.findAll();
        Map<String, HotelService> byName = new HashMap<>();
        for (HotelService h : existing) byName.put(h.getName(), h);

        List<HotelService> result = new ArrayList<>();
        for (ServiceSpec s : specs) {
            HotelService svc = byName.getOrDefault(s.name(), new HotelService());
            svc.setName(s.name());
            svc.setCategory(s.category());
            svc.setPrice(new BigDecimal(s.price()));
            svc.setActive(true);
            result.add(hotelServiceRepository.save(svc));
        }
        return result;
    }

    // ─── Service Charges (B2) ───────────────────────────────────────────────

    /**
     * ServiceCharge.@PrePersist forces createdAt = now() and the entity has no
     * setter for it, so we insert raw via JdbcTemplate to preserve a date
     * within the reservation's stay.
     */
    private int seedServiceCharges(List<Reservation> pastCheckedOut, List<HotelService> services, Random random) {
        if (pastCheckedOut.isEmpty() || services.isEmpty()) return 0;
        final int target = 80;
        List<Object[]> rows = new ArrayList<>(target);
        for (int i = 0; i < target; i++) {
            Reservation res = pastCheckedOut.get(random.nextInt(pastCheckedOut.size()));
            HotelService svc = services.get(random.nextInt(services.size()));
            int quantity = pickServiceQuantity(svc.getName(), random);
            BigDecimal price = svc.getPrice();
            BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));
            long stayNights = res.getCheckOutDate().toEpochDay() - res.getCheckInDate().toEpochDay();
            LocalDate appliedDate = stayNights > 0
                    ? res.getCheckInDate().plusDays(random.nextInt((int) stayNights))
                    : res.getCheckInDate();
            LocalDateTime appliedAt = appliedDate.atTime(10 + random.nextInt(8), random.nextInt(60));
            rows.add(new Object[]{res.getId(), svc.getId(), price, quantity, total, appliedAt});
        }
        jdbcTemplate.batchUpdate(
                "INSERT INTO service_charges (reservation_id, service_id, price, quantity, total, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                rows);
        return rows.size();
    }

    private int pickServiceQuantity(String name, Random random) {
        if (name.startsWith("Breakfast")) return 1 + random.nextInt(3); // 1-3 people
        if (name.startsWith("Laundry")) return 3 + random.nextInt(5);   // 3-7 kg
        return 1;
    }

    // ─── Expenses (B3) ──────────────────────────────────────────────────────

    /**
     * 80 expenses spread across past 730 days. The brief's distribution
     * totalled ~110; reduced here to exactly 80 by trimming each bucket
     * proportionally while keeping monthly salaries intact.
     */
    private int seedExpenses(User manager, LocalDate today, Random random) {
        List<Expense> expenses = new ArrayList<>(80);
        // 24 salaries — 28th of each of past 24 months
        for (int i = 0; i < 24; i++) {
            LocalDate base = today.minusMonths(24 - i).withDayOfMonth(1);
            int day = Math.min(28, base.lengthOfMonth());
            LocalDate date = base.withDayOfMonth(day);
            expenses.add(buildExpense(
                    "Monthly salaries - " + base.getMonth().name() + " " + base.getYear(),
                    "Combined payroll for front-desk, housekeeping and management staff.",
                    ExpenseCategory.SALARIES,
                    new BigDecimal(43000 + random.nextInt(5000)),
                    date, "Roomify Payroll", PaymentMethod.BANK_TRANSFER, true, manager));
        }
        // 12 utilities — every ~2 months, higher in Jun-Aug
        for (int i = 0; i < 12; i++) {
            LocalDate date = today.minusDays(60L * (12 - i)).withDayOfMonth(5 + random.nextInt(10));
            boolean summer = date.getMonth() == Month.JUNE || date.getMonth() == Month.JULY || date.getMonth() == Month.AUGUST;
            int amt = summer ? 12000 + random.nextInt(3000) : 8000 + random.nextInt(3000);
            expenses.add(buildExpense(
                    "Utilities (electricity, water, internet) - " + date.getMonth() + " " + date.getYear(),
                    "Combined utility bill for the property.",
                    ExpenseCategory.UTILITIES, new BigDecimal(amt),
                    date, "National Utilities", PaymentMethod.ONLINE, true, manager));
        }
        // 12 maintenance — irregular
        for (int i = 0; i < 12; i++) {
            LocalDate date = today.minusDays(random.nextInt(730));
            expenses.add(buildExpense(
                    "Maintenance - " + pickMaintenanceLabel(random),
                    "Ad-hoc repair work for guest rooms or common areas.",
                    ExpenseCategory.MAINTENANCE, new BigDecimal(500 + random.nextInt(3500)),
                    date, "Facility Masters", PaymentMethod.CARD, false, manager));
        }
        // 12 supplies (CONSUMABLES + CLEANING_SUPPLIES mix)
        for (int i = 0; i < 12; i++) {
            LocalDate date = today.minusDays(random.nextInt(730));
            ExpenseCategory cat = random.nextBoolean() ? ExpenseCategory.CONSUMABLES : ExpenseCategory.CLEANING_SUPPLIES;
            expenses.add(buildExpense(
                    "Supplies restock - " + (cat == ExpenseCategory.CONSUMABLES ? "toiletries & linens" : "cleaning chemicals"),
                    "Routine restock of operating supplies.",
                    cat, new BigDecimal(300 + random.nextInt(2200)),
                    date, "Hospitality Supply Co.", PaymentMethod.CARD, false, manager));
        }
        // 12 marketing — higher around Eid/summer
        for (int i = 0; i < 12; i++) {
            LocalDate date = today.minusDays(60L * (12 - i)).plusDays(random.nextInt(28));
            boolean peak = date.getMonth() == Month.MARCH || date.getMonth() == Month.APRIL
                    || date.getMonth() == Month.JUNE || date.getMonth() == Month.JULY || date.getMonth() == Month.AUGUST;
            int amt = peak ? 4000 + random.nextInt(2000) : 1000 + random.nextInt(2000);
            expenses.add(buildExpense(
                    "Digital marketing campaign - " + date.getMonth() + " " + date.getYear(),
                    "Search and OTA placements driving direct bookings.",
                    ExpenseCategory.MARKETING, new BigDecimal(amt),
                    date, "Travel Media Hub", PaymentMethod.CARD, false, manager));
        }
        // 8 miscellaneous
        for (int i = 0; i < 8; i++) {
            LocalDate date = today.minusDays(random.nextInt(730));
            expenses.add(buildExpense(
                    "Miscellaneous - " + pickMiscLabel(random),
                    "One-off operating expense.",
                    ExpenseCategory.MISCELLANEOUS, new BigDecimal(200 + random.nextInt(1500)),
                    date, "Various", PaymentMethod.CASH, false, manager));
        }
        expenseRepository.saveAll(expenses);
        return expenses.size();
    }

    private Expense buildExpense(String title, String description, ExpenseCategory category,
            BigDecimal amount, LocalDate date, String vendor, PaymentMethod method,
            boolean recurring, User createdBy) {
        Expense e = new Expense();
        e.setTitle(title);
        e.setDescription(description);
        e.setCategory(category);
        e.setAmount(amount);
        e.setExpenseDate(date);
        e.setVendor(vendor);
        e.setPaymentMethod(method);
        e.setRecurring(recurring);
        e.setCreatedBy(createdBy);
        LocalDateTime stamp = date.atTime(10, 0);
        e.setCreatedAt(stamp);
        e.setUpdatedAt(stamp);
        return e;
    }

    private String pickMaintenanceLabel(Random random) {
        String[] labels = {"HVAC repair", "Plumbing fix", "Door lock replacement",
                "Pool pump service", "Electrical inspection", "Carpet cleaning"};
        return labels[random.nextInt(labels.length)];
    }

    private String pickMiscLabel(Random random) {
        String[] labels = {"Bank fees", "License renewal", "Insurance premium",
                "Training course", "Software subscription"};
        return labels[random.nextInt(labels.length)];
    }

    // ─── Inventory items (B4) ───────────────────────────────────────────────

    private List<InventoryItem> seedInventoryItems() {
        record ItemSpec(String name, InventoryCategory category, InventoryUnitOfMeasure unit, int initialStock, int min) {}
        List<ItemSpec> specs = List.of(
                new ItemSpec("Bath towels (large)", InventoryCategory.LAUNDRY_LINEN_SUPPLIES, InventoryUnitOfMeasure.PIECE, 200, 60),
                new ItemSpec("Bath towels (small)", InventoryCategory.LAUNDRY_LINEN_SUPPLIES, InventoryUnitOfMeasure.PIECE, 250, 80),
                new ItemSpec("Bed linens (queen)", InventoryCategory.LAUNDRY_LINEN_SUPPLIES, InventoryUnitOfMeasure.PACK, 80, 25),
                new ItemSpec("Bed linens (single)", InventoryCategory.LAUNDRY_LINEN_SUPPLIES, InventoryUnitOfMeasure.PACK, 60, 20),
                new ItemSpec("Shampoo bottles (200ml)", InventoryCategory.TOILETRIES, InventoryUnitOfMeasure.BOTTLE, 150, 50),
                new ItemSpec("Conditioner bottles (200ml)", InventoryCategory.TOILETRIES, InventoryUnitOfMeasure.BOTTLE, 150, 50),
                new ItemSpec("Soap bars", InventoryCategory.TOILETRIES, InventoryUnitOfMeasure.PIECE, 300, 100),
                new ItemSpec("Toilet paper rolls", InventoryCategory.TOILETRIES, InventoryUnitOfMeasure.ROLL, 400, 120),
                new ItemSpec("Bottled water (500ml)", InventoryCategory.CONSUMABLES, InventoryUnitOfMeasure.BOTTLE, 500, 150),
                new ItemSpec("Coffee pods", InventoryCategory.CONSUMABLES, InventoryUnitOfMeasure.PIECE, 600, 200),
                new ItemSpec("Tea bags", InventoryCategory.CONSUMABLES, InventoryUnitOfMeasure.PIECE, 800, 250),
                new ItemSpec("Cleaning solution (5L)", InventoryCategory.CLEANING_CHEMICALS, InventoryUnitOfMeasure.BOTTLE, 30, 10),
                new ItemSpec("Disinfectant spray (1L)", InventoryCategory.CLEANING_CHEMICALS, InventoryUnitOfMeasure.BOTTLE, 50, 15),
                new ItemSpec("Trash bags (large)", InventoryCategory.CONSUMABLES, InventoryUnitOfMeasure.PIECE, 1000, 300),
                new ItemSpec("Laundry detergent (5kg)", InventoryCategory.CLEANING_CHEMICALS, InventoryUnitOfMeasure.PACK, 25, 8));

        List<InventoryItem> existing = inventoryItemRepository.findAll();
        Map<String, InventoryItem> byName = new HashMap<>();
        for (InventoryItem i : existing) byName.put(i.getName(), i);

        List<InventoryItem> items = new ArrayList<>(specs.size());
        for (ItemSpec s : specs) {
            InventoryItem it = byName.getOrDefault(s.name(), new InventoryItem());
            it.setName(s.name());
            it.setCategory(s.category());
            it.setUnitOfMeasure(s.unit());
            it.setCurrentStockQuantity(BigDecimal.valueOf(s.initialStock()));
            it.setMinimumStockThreshold(BigDecimal.valueOf(s.min()));
            it.setDefaultUnitCost(BigDecimal.valueOf(5 + (s.name().hashCode() & 0x7) * 2));
            it.setAverageUnitCost(it.getDefaultUnitCost());
            it.setActive(true);
            it.setSupplier("Hospitality Supply Co.");
            items.add(it);
        }
        return inventoryItemRepository.saveAll(items);
    }

    // ─── Inventory transactions (B5) ────────────────────────────────────────

    /**
     * For each item, 3-6 historical transactions spread across the past 180
     * days. ~60% USAGE_CONSUMPTION (negative), ~40% PURCHASE_RESTOCK (positive).
     * Transactions are inserted directly via JdbcTemplate so occurred_at and
     * created_at can be backdated together (the entity's @PrePersist would
     * otherwise stamp created_at = now()).
     */
    private int seedInventoryTransactions(List<InventoryItem> items, User manager, List<User> staffUsers,
            LocalDate today, Random random) {
        List<Object[]> rows = new ArrayList<>();
        LocalDate windowStart = today.minusDays(180);
        List<User> actorPool = new ArrayList<>(staffUsers);
        actorPool.add(manager);

        for (InventoryItem item : items) {
            int txCount = 3 + random.nextInt(4); // 3-6
            BigDecimal runningStock = item.getCurrentStockQuantity();
            // Walk backwards in time so stockAfter on the most recent matches the item's current stock.
            List<Object[]> itemRows = new ArrayList<>();
            for (int i = 0; i < txCount; i++) {
                boolean restock = random.nextDouble() < 0.40d;
                BigDecimal qty = restock
                        ? BigDecimal.valueOf(20 + random.nextInt(80))
                        : BigDecimal.valueOf(-(1 + random.nextInt(10)));
                BigDecimal stockAfter = runningStock;
                BigDecimal stockBefore = stockAfter.subtract(qty);
                BigDecimal unitCost = item.getDefaultUnitCost();
                BigDecimal totalValue = unitCost.multiply(qty.abs()).setScale(2, java.math.RoundingMode.HALF_UP);
                int daysAgo = i * 30 + random.nextInt(20);
                LocalDateTime occurredAt = windowStart.plusDays(180L - daysAgo).atTime(9 + random.nextInt(8), random.nextInt(60));
                User actor = actorPool.get(random.nextInt(actorPool.size()));
                InventoryTransactionType type = restock
                        ? InventoryTransactionType.PURCHASE_RESTOCK
                        : InventoryTransactionType.USAGE_CONSUMPTION;
                itemRows.add(new Object[]{
                        item.getId(), type.name(), qty, stockBefore, stockAfter,
                        unitCost, totalValue, occurredAt, actor.getId(), occurredAt});
                runningStock = stockBefore;
            }
            rows.addAll(itemRows);
        }
        jdbcTemplate.batchUpdate(
                "INSERT INTO inventory_transactions ("
                        + "inventory_item_id, transaction_type, quantity_change, stock_before, stock_after, "
                        + "unit_cost, total_value, occurred_at, created_by_user_id, created_at"
                        + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                rows);
        return rows.size();
    }

    // ─── Reporting ──────────────────────────────────────────────────────────

    private void logSummary(SeedReport report, Phase2Counts phase2, long durationMs) {
        int total = report.allReservations().size();
        int past = report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_OUT, List.of()).size()
                + report.reservationsByStatus().getOrDefault(ReservationStatus.CANCELLED, List.of()).size();
        int current = report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_IN, List.of()).size();
        int future = report.reservationsByStatus().getOrDefault(ReservationStatus.CONFIRMED, List.of()).size()
                + report.reservationsByStatus().getOrDefault(ReservationStatus.PENDING, List.of()).size();
        int paymentsCount = report.reservationsByStatus().getOrDefault(ReservationStatus.CHECKED_OUT, List.of()).size();
        int invoicesCount = paymentsCount;

        StringBuilder months = new StringBuilder();
        for (Map.Entry<Month, Integer> entry : report.reservationsByMonth().entrySet()) {
            if (months.length() > 0) months.append(", ");
            months.append(entry.getKey().name(), 0, 3).append(": ").append(entry.getValue());
        }

        log.info("Seeded {} guests, {} reservations ({} past 2yr / {} current / {} future), {} payments, {} invoices, "
                        + "{} services, {} service charges, {} expenses, {} inventory items, {} inventory transactions. "
                        + "Reservations per month: [{}]. Run took {}.{}s.",
                TARGET_GUEST_COUNT, total, past, current, future, paymentsCount, invoicesCount,
                phase2.services(), phase2.serviceCharges(), phase2.expenses(),
                phase2.inventoryItems(), phase2.inventoryTransactions(),
                months.toString(), durationMs / 1000, String.format("%03d", durationMs % 1000));
    }

    // ─── Helper records ─────────────────────────────────────────────────────

    private record EventWindow(LocalDate start, LocalDate end, double multiplier, String label) {
    }

    private record DateRange(LocalDate start, LocalDate end) {
    }

    private record SeedReport(
            List<Reservation> allReservations,
            Map<ReservationStatus, List<Reservation>> reservationsByStatus,
            Map<Month, Integer> reservationsByMonth) {
    }

    private record Phase2Counts(
            int services,
            int serviceCharges,
            int expenses,
            int inventoryItems,
            int inventoryTransactions) {
    }
}
