package com.roomify.backend.config;

import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.service.ReservationFinancialService;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
@Transactional
@ConditionalOnProperty(value = "roomify.demo.bootstrap.enabled", havingValue = "true")
public class DemoDataBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataBootstrap.class);

    private static final String DEMO_ADMIN_EMAIL = "admin@roomify.com";
    private static final String DEMO_ADMIN_PASSWORD = "password123";
    private static final String DEMO_GUEST_EMAIL = "demo.guest@roomify.dev";
    private static final String DEMO_GUEST_ID = "ROOMIFY-DEMO-GUEST";

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationFinancialService reservationFinancialService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataBootstrap(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            GuestRepository guestRepository,
            ReservationRepository reservationRepository,
            ReservationFinancialService reservationFinancialService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.reservationRepository = reservationRepository;
        this.reservationFinancialService = reservationFinancialService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        upsertDemoAdminUser();

        RoomType demoStandard = upsertRoomType(new RoomTypeSpec(
                "Demo Standard",
                new BigDecimal("430.00"),
                2,
                "WiFi, Smart TV, Breakfast",
                "Stable demo inventory for quick front-desk walkthroughs."));
        RoomType demoDeluxe = upsertRoomType(new RoomTypeSpec(
                "Demo Deluxe",
                new BigDecimal("690.00"),
                3,
                "WiFi, Smart TV, Coffee Station, City View",
                "Mid-tier demo inventory for booking and modification flows."));
        RoomType demoSuite = upsertRoomType(new RoomTypeSpec(
                "Demo Suite",
                new BigDecimal("980.00"),
                4,
                "WiFi, Smart TV, Lounge Area, Balcony",
                "Premium demo inventory kept open for same-day availability searches."));

        Room roomD101 = upsertRoom("D101", demoStandard, 1);
        Room roomD102 = upsertRoom("D102", demoStandard, 1);
        Room roomD201 = upsertRoom("D201", demoDeluxe, 2);
        Room roomD202 = upsertRoom("D202", demoDeluxe, 2);
        Room roomD301 = upsertRoom("D301", demoSuite, 3);
        Room roomD302 = upsertRoom("D302", demoStandard, 3);

        Guest demoGuest = upsertGuest();
        LocalDate today = LocalDate.now();

        List<ReservationSpec> reservations = List.of(
                new ReservationSpec("DEMO-CHECKIN-READY", roomD101, ReservationStatus.CONFIRMED, 0, 1),
                new ReservationSpec("DEMO-CHECKIN-BLOCKED", roomD102, ReservationStatus.CONFIRMED, 1, 2),
                new ReservationSpec("DEMO-CANCEL", roomD201, ReservationStatus.PENDING, 3, 5),
                new ReservationSpec("DEMO-MODIFY", roomD202, ReservationStatus.CONFIRMED, 5, 7),
                new ReservationSpec("DEMO-MODIFY-CONFLICT", roomD301, ReservationStatus.CONFIRMED, 6, 8));

        reservations.forEach(spec -> upsertReservation(spec, demoGuest, today));

        log.info("Demo bootstrap refreshed 6 demo rooms and {} demo reservations for {}", reservations.size(), today);
    }

    private void upsertDemoAdminUser() {
        String encodedPassword = passwordEncoder.encode(DEMO_ADMIN_PASSWORD);
        User adminUser = userRepository.findByEmailIgnoreCase(DEMO_ADMIN_EMAIL)
                .orElseGet(() -> new User(DEMO_ADMIN_EMAIL, encodedPassword, Role.MANAGER, true));
        adminUser.setEmail(DEMO_ADMIN_EMAIL);
        adminUser.setPasswordHash(encodedPassword);
        adminUser.setRole(Role.MANAGER);
        adminUser.setActive(true);
        adminUser.setFailedAttempts(0);
        adminUser.setLockUntil(null);
        userRepository.save(adminUser);
    }

    private RoomType upsertRoomType(RoomTypeSpec spec) {
        RoomType roomType = roomTypeRepository.findByName(spec.name()).orElseGet(RoomType::new);
        roomType.setName(spec.name());
        roomType.setBasePrice(spec.basePrice());
        roomType.setMaxGuests(spec.maxGuests());
        roomType.setAmenities(spec.amenities());
        roomType.setDescription(spec.description());
        return roomTypeRepository.save(roomType);
    }

    private Room upsertRoom(String roomNumber, RoomType roomType, int floor) {
        Room room = roomRepository.findByRoomNumber(roomNumber).orElseGet(Room::new);
        room.setRoomNumber(roomNumber);
        room.setRoomType(roomType);
        room.setFloor(floor);
        room.setStatus(RoomStatus.AVAILABLE);
        return roomRepository.save(room);
    }

    private Guest upsertGuest() {
        Guest guest = guestRepository.findByEmailIgnoreCase(DEMO_GUEST_EMAIL).orElseGet(Guest::new);
        guest.setName("Demo Guest");
        guest.setEmail(DEMO_GUEST_EMAIL);
        guest.setPhone("+966500000111");
        guest.setIdNumber(DEMO_GUEST_ID);
        guest.setNationality("Saudi");
        return guestRepository.save(guest);
    }

    private void upsertReservation(ReservationSpec spec, Guest guest, LocalDate today) {
        Reservation reservation = reservationRepository.findByConfirmationNumber(spec.confirmationNumber())
                .orElseGet(Reservation::new);

        reservation.setGuest(guest);
        reservation.setRoom(spec.room());
        reservation.setCheckInDate(today.plusDays(spec.checkInOffsetDays()));
        reservation.setCheckOutDate(today.plusDays(spec.checkOutOffsetDays()));
        reservation.setStatus(spec.status());
        reservation.setConfirmationNumber(spec.confirmationNumber());
        reservation.setInvoiceNumber(null);
        reservation.setActualCheckInDate(null);
        reservation.setActualCheckOutAt(null);
        reservation.setCancellationReason(null);
        reservation.setCancellationAt(null);
        reservation.setModificationReason(null);
        reservation.setTotalPrice(BigDecimal.ZERO);
        reservation.setTotalPaid(BigDecimal.ZERO);
        reservation.setOutstandingBalance(BigDecimal.ZERO);
        reservation.setPaymentStatus(PaymentStatus.UNPAID);
        reservation.setInvoiceFinalized(false);

        reservationFinancialService.syncReservation(reservation);
        reservationRepository.save(reservation);
    }

    private record RoomTypeSpec(
            String name,
            BigDecimal basePrice,
            Integer maxGuests,
            String amenities,
            String description) {
    }

    private record ReservationSpec(
            String confirmationNumber,
            Room room,
            ReservationStatus status,
            long checkInOffsetDays,
            long checkOutOffsetDays) {
    }
}
