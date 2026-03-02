package com.roomify.backend.service;

<<<<<<< Updated upstream
=======
<<<<<<< HEAD
import com.roomify.backend.config.TestConfig;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
=======
>>>>>>> Stashed changes
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
>>>>>>> bff9fa02a9f19e9f9b93108d3ab45623128aa7f4
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

<<<<<<< Updated upstream
=======
<<<<<<< HEAD
import java.math.BigDecimal;
import java.time.LocalDate;
=======
>>>>>>> Stashed changes
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationGuestRequest;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
<<<<<<< Updated upstream
=======
>>>>>>> bff9fa02a9f19e9f9b93108d3ab45623128aa7f4
>>>>>>> Stashed changes

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Import(TestConfig.class)
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reservationserviceit;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "roomify.jwt.expiration=3600000",
        "roomify.reservations.tax-rate=0.10"
})
@Transactional
class ReservationServiceIT {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;
<<<<<<< Updated upstream
=======
<<<<<<< HEAD

    private Long roomId;

    @BeforeEach
    void setUp() {
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();

        RoomType roomType = roomTypeRepository.save(
                new RoomType("Suite", new BigDecimal("300.00"), 2, "WiFi", "Suite room"));
        Room room = roomRepository.save(new Room("505", roomType, 5, RoomStatus.AVAILABLE));
        roomId = room.getId();
=======
>>>>>>> Stashed changes

    @Test
    void shouldThrowExceptionWhenBookingOverlaps() {
        // 1. Setup: Create and save a room type + room
        RoomType roomType = roomTypeRepository.save(
                new RoomType("Standard", new BigDecimal("100.00"), 2, "WiFi", "Standard room"));
        Room room = roomRepository.save(new Room("101", roomType, 1, RoomStatus.AVAILABLE));

        ReservationGuestRequest guestRequest = new ReservationGuestRequest(
                "Test Guest", "test@example.com", "+966500000000", "ID12345", "Saudi");

        // 2. Create an existing reservation via the service
        ReservationCreateRequest existing = new ReservationCreateRequest(
                room.getId(),
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 15),
                null,
                guestRequest);
        reservationService.create(existing);

        // 3. Try to create an overlapping reservation (should fail)
        ReservationCreateRequest overlapping = new ReservationCreateRequest(
                room.getId(),
                LocalDate.of(2026, 3, 12), // Overlaps!
                LocalDate.of(2026, 3, 18),
                null,
                guestRequest);

        // 4. Assert that booking conflict is detected
        assertThrows(ResourceConflictException.class, () -> reservationService.create(overlapping));
<<<<<<< Updated upstream
=======
>>>>>>> bff9fa02a9f19e9f9b93108d3ab45623128aa7f4
>>>>>>> Stashed changes
    }

    @Test
    void createShouldPersistReservationAndReturnConfirmationNumber() {
        ReservationCreateRequest request = new ReservationCreateRequest(
                roomId,
                LocalDate.now().plusDays(3),
                LocalDate.now().plusDays(5),
                ReservationStatus.CONFIRMED,
                new ReservationGuestRequest(
                        "Service Test Guest",
                        "service.test@example.com",
                        "0501231234",
                        "ID-SERVICE-1",
                        "USA"));

        ReservationResponse response = reservationService.create(request);

        assertNotNull(response.getId());
        assertNotNull(response.getConfirmationNumber());
        assertEquals(ReservationStatus.CONFIRMED, response.getStatus());
        assertEquals(2L, response.getNights());
    }

    @Test
    void createShouldThrowConflictWhenDateRangeIsInvalid() {
        ReservationCreateRequest request = new ReservationCreateRequest(
                roomId,
                LocalDate.now().plusDays(7),
                LocalDate.now().plusDays(6),
                ReservationStatus.PENDING,
                new ReservationGuestRequest(
                        "Conflict Guest",
                        "conflict@example.com",
                        "0504564567",
                        "ID-CONFLICT-1",
                        "USA"));

        assertThrows(ResourceConflictException.class, () -> reservationService.create(request));
    }
}
