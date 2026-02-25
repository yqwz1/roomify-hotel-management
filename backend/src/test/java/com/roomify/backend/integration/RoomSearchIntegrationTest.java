package com.roomify.backend.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roomify.backend.config.TestConfig;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * Integration tests for the room availability search endpoint.
 * GET /api/rooms/search
 */
@Import(TestConfig.class)
@SpringBootTest(properties = {
                "spring.datasource.url=jdbc:h2:mem:searchdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
                "spring.datasource.driverClassName=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "roomify.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
                "roomify.jwt.expiration=3600000"
})
class RoomSearchIntegrationTest {

        private MockMvc mockMvc;

        @Autowired
        private WebApplicationContext webApplicationContext;

        @Autowired
        private RoomRepository roomRepository;

        @Autowired
        private RoomTypeRepository roomTypeRepository;

        @Autowired
        private ReservationRepository reservationRepository;

        @Autowired
        private GuestRepository guestRepository;

        private RoomType standardType;
        private RoomType deluxeType;
        private Room room101;
        private Room room301;
        private Guest testGuest;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                                .apply(springSecurity())
                                .build();

                // Clean up in correct order (reservations → rooms → types → guests)
                reservationRepository.deleteAll();
                roomRepository.deleteAll();
                roomTypeRepository.deleteAll();
                guestRepository.deleteAll();

                // Create room types
                standardType = roomTypeRepository.save(new RoomType(
                                "Standard", new BigDecimal("100.00"), 2, "WiFi, TV", "Standard room"));

                deluxeType = roomTypeRepository.save(new RoomType(
                                "Deluxe", new BigDecimal("250.00"), 4, "WiFi, TV, Mini Bar", "Deluxe room"));

                // Create rooms (all AVAILABLE)
                room101 = roomRepository.save(new Room("101", standardType, 1, RoomStatus.AVAILABLE));
                roomRepository.save(new Room("201", deluxeType, 2, RoomStatus.AVAILABLE));
                room301 = roomRepository.save(new Room("301", standardType, 3, RoomStatus.AVAILABLE));

                // Create a test guest for reservations
                testGuest = guestRepository.save(new Guest(
                                "Test Guest", "test@example.com", "+966500000000", "ID12345", "Saudi"));
        }

        // -----------------------------------------------------------------------
        // Basic search — returns available rooms
        // -----------------------------------------------------------------------

        @Test
        void searchWithValidDatesReturnsAllAvailableRooms() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(3))
                                .andExpect(jsonPath("$.rooms", hasSize(3)));
        }

        // -----------------------------------------------------------------------
        // No authentication required
        // -----------------------------------------------------------------------

        @Test
        void searchDoesNotRequireAuthentication() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                // No Authorization header — should still return 200
                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk());
        }

        // -----------------------------------------------------------------------
        // Reservation overlap exclusion
        // -----------------------------------------------------------------------

        @Test
        void searchExcludesRoomWithOverlappingReservation() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(5);
                LocalDate checkOut = LocalDate.now().plusDays(10);

                // Create overlapping reservation for room101
                reservationRepository.save(new Reservation(
                                testGuest, room101,
                                LocalDate.now().plusDays(6), LocalDate.now().plusDays(8),
                                new BigDecimal("200.00"), ReservationStatus.CONFIRMED, "CONF-001"));

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(2))
                                .andExpect(jsonPath("$.rooms", hasSize(2)));
        }

        @Test
        void searchIncludesRoomWithCancelledReservation() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(5);
                LocalDate checkOut = LocalDate.now().plusDays(10);

                // Create a CANCELLED reservation — should NOT block availability
                reservationRepository.save(new Reservation(
                                testGuest, room101,
                                LocalDate.now().plusDays(6), LocalDate.now().plusDays(8),
                                new BigDecimal("200.00"), ReservationStatus.CANCELLED, "CONF-002"));

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(3))
                                .andExpect(jsonPath("$.rooms", hasSize(3)));
        }

        @Test
        void searchExcludesRoomWithNonOverlappingReservation() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(10);
                LocalDate checkOut = LocalDate.now().plusDays(15);

                // Reservation ends before search range — should NOT exclude the room
                reservationRepository.save(new Reservation(
                                testGuest, room101,
                                LocalDate.now().plusDays(1), LocalDate.now().plusDays(5),
                                new BigDecimal("400.00"), ReservationStatus.CONFIRMED, "CONF-003"));

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(3))
                                .andExpect(jsonPath("$.rooms", hasSize(3)));
        }

        // -----------------------------------------------------------------------
        // Room status filter — only AVAILABLE rooms
        // -----------------------------------------------------------------------

        @Test
        void searchExcludesMaintenanceRoom() throws Exception {
                // Set room301 to MAINTENANCE
                room301.setStatus(RoomStatus.UNDER_MAINTENANCE);
                roomRepository.save(room301);

                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(2))
                                .andExpect(jsonPath("$.rooms", hasSize(2)));
        }

        // -----------------------------------------------------------------------
        // Filters — room type, price range, guest capacity
        // -----------------------------------------------------------------------

        @Test
        void searchFiltersByRoomTypeName() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString())
                                .param("roomType", "Deluxe"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(1))
                                .andExpect(jsonPath("$.rooms[0].roomNumber").value("201"));
        }

        @Test
        void searchFiltersByMinPrice() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString())
                                .param("minPrice", "200"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(1))
                                .andExpect(jsonPath("$.rooms[0].roomType.name").value("Deluxe"));
        }

        @Test
        void searchFiltersByMaxPrice() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString())
                                .param("maxPrice", "150"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(2));
        }

        @Test
        void searchFiltersByGuestCapacity() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                // Deluxe maxGuests=4, Standard maxGuests=2
                // guests=3 should only return Deluxe rooms
                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString())
                                .param("guests", "3"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalResults").value(1))
                                .andExpect(jsonPath("$.rooms[0].roomType.name").value("Deluxe"));
        }

        // -----------------------------------------------------------------------
        // Sorting
        // -----------------------------------------------------------------------

        @Test
        void searchSortsByPriceAscByDefault() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.rooms[0].roomType.name").value("Standard"))
                                .andExpect(jsonPath("$.rooms[2].roomType.name").value("Deluxe"));
        }

        @Test
        void searchSortsByPriceDesc() throws Exception {
                LocalDate checkIn = LocalDate.now().plusDays(1);
                LocalDate checkOut = LocalDate.now().plusDays(3);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", checkIn.toString())
                                .param("checkOut", checkOut.toString())
                                .param("sortBy", "PRICE")
                                .param("sortDirection", "DESC"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.rooms[0].roomType.name").value("Deluxe"));
        }

        // -----------------------------------------------------------------------
        // Validation errors
        // -----------------------------------------------------------------------

        @Test
        void searchWithMissingCheckInReturns400() throws Exception {
                mockMvc.perform(get("/api/rooms/search")
                                .param("checkOut", LocalDate.now().plusDays(3).toString()))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void searchWithMissingCheckOutReturns400() throws Exception {
                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", LocalDate.now().plusDays(1).toString()))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void searchWithPastCheckInReturns400() throws Exception {
                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", LocalDate.now().minusDays(1).toString())
                                .param("checkOut", LocalDate.now().plusDays(3).toString()))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void searchWithCheckOutBeforeCheckInReturns400() throws Exception {
                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", LocalDate.now().plusDays(5).toString())
                                .param("checkOut", LocalDate.now().plusDays(2).toString()))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void searchWithCheckOutEqualsCheckInReturns400() throws Exception {
                LocalDate date = LocalDate.now().plusDays(5);

                mockMvc.perform(get("/api/rooms/search")
                                .param("checkIn", date.toString())
                                .param("checkOut", date.toString()))
                                .andExpect(status().isBadRequest());
        }
}
