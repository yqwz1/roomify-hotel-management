package com.roomify.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.math.BigDecimal;
import java.util.List;

import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.StaffRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:schemadb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration"
})
class ReservationSchemaAlignmentTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ReservationSchemaAlignment reservationSchemaAlignment;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM reservations");
        jdbcTemplate.execute("DELETE FROM rooms");
        jdbcTemplate.execute("DELETE FROM room_types");
        jdbcTemplate.execute("DELETE FROM staff");
        jdbcTemplate.execute("DELETE FROM users");
    }

    @Test
    void reAddsMissingPaymentStatusColumn() throws Exception {
        jdbcTemplate.execute("ALTER TABLE reservations DROP COLUMN payment_status");

        reservationSchemaAlignment.run(new DefaultApplicationArguments(new String[0]));

        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'RESERVATIONS'
                  AND COLUMN_NAME = 'PAYMENT_STATUS'
                """,
                Integer.class);

        assertEquals(1, count);
    }

    @Test
    void repairsLegacyRoomTypeColumnName() throws Exception {
        RoomType roomType = roomTypeRepository.save(new RoomType(
                "Deluxe",
                new BigDecimal("220.00"),
                3,
                "WiFi",
                "Deluxe room"));
        Room room = roomRepository.save(new Room("401", roomType, 4, RoomStatus.AVAILABLE));

        jdbcTemplate.execute("ALTER TABLE rooms RENAME COLUMN room_type_id TO room_type");

        reservationSchemaAlignment.run(new DefaultApplicationArguments(new String[0]));

        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'ROOMS'
                  AND COLUMN_NAME = 'ROOM_TYPE_ID'
                """,
                Integer.class);

        assertEquals(1, count);
        Room repaired = roomRepository.findById(room.getId()).orElseThrow();
        assertEquals(roomType.getId(), repaired.getRoomType().getId());
    }

    @Test
    void normalizesLegacyRoomStatusValues() throws Exception {
        RoomType roomType = roomTypeRepository.save(new RoomType(
                "Standard",
                new BigDecimal("100.00"),
                2,
                "TV",
                "Standard room"));

        Room cleaningRoom = roomRepository.save(new Room("201", roomType, 2, RoomStatus.AVAILABLE));
        Room maintenanceRoom = roomRepository.save(new Room("202", roomType, 2, RoomStatus.AVAILABLE));
        Room availableRoom = roomRepository.save(new Room("203", roomType, 2, RoomStatus.AVAILABLE));
        Room occupiedRoom = roomRepository.save(new Room("204", roomType, 2, RoomStatus.AVAILABLE));

        jdbcTemplate.execute("ALTER TABLE rooms ALTER COLUMN status SET DATA TYPE VARCHAR(30)");
        jdbcTemplate.update("UPDATE rooms SET status = 'MAINTENANCE' WHERE id = ?", cleaningRoom.getId());
        jdbcTemplate.update("UPDATE rooms SET status = 'OUT_OF_SERVICE' WHERE id = ?", maintenanceRoom.getId());
        jdbcTemplate.update("UPDATE rooms SET status = 'Available' WHERE id = ?", availableRoom.getId());
        jdbcTemplate.update("UPDATE rooms SET status = 'Occupied' WHERE id = ?", occupiedRoom.getId());

        reservationSchemaAlignment.run(new DefaultApplicationArguments(new String[0]));

        assertEquals(RoomStatus.NEEDS_CLEANING, roomRepository.findById(cleaningRoom.getId()).orElseThrow().getStatus());
        assertEquals(RoomStatus.UNDER_MAINTENANCE,
                roomRepository.findById(maintenanceRoom.getId()).orElseThrow().getStatus());
        assertEquals(RoomStatus.AVAILABLE, roomRepository.findById(availableRoom.getId()).orElseThrow().getStatus());
        assertEquals(RoomStatus.OCCUPIED, roomRepository.findById(occupiedRoom.getId()).orElseThrow().getStatus());
    }

    @Test
    void backfillsRoomTypeIdFromLegacyTypeAndPriceColumns() throws Exception {
        RoomType unrelated = roomTypeRepository.save(new RoomType(
                "Legacy Placeholder",
                new BigDecimal("999.00"),
                2,
                "",
                "placeholder"));
        Room room = roomRepository.save(new Room("301", unrelated, 3, RoomStatus.AVAILABLE));

        jdbcTemplate.execute("ALTER TABLE rooms ADD COLUMN type VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE rooms ADD COLUMN price DOUBLE PRECISION");
        jdbcTemplate.execute("ALTER TABLE rooms ALTER COLUMN room_type_id DROP NOT NULL");
        jdbcTemplate.update("UPDATE rooms SET room_type_id = NULL, type = 'Suite', price = 300.00 WHERE id = ?", room.getId());

        reservationSchemaAlignment.run(new DefaultApplicationArguments(new String[0]));

        Room repaired = roomRepository.findById(room.getId()).orElseThrow();
        RoomType repairedType = roomTypeRepository.findById(repaired.getRoomType().getId()).orElseThrow();
        assertEquals("Suite", repairedType.getName());
        assertEquals(new BigDecimal("300.00"), repairedType.getBasePrice());
    }

    @Test
    void relaxesLegacyRoomColumnsSoCanonicalRoomCrudStillWorks() throws Exception {
        RoomType roomType = roomTypeRepository.save(new RoomType(
                "Verification Type",
                new BigDecimal("180.00"),
                2,
                "WiFi",
                "Verification"));

        jdbcTemplate.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION");
        jdbcTemplate.execute("UPDATE rooms SET price = COALESCE(price, 99.0)");
        jdbcTemplate.execute("ALTER TABLE rooms ALTER COLUMN price SET DEFAULT 99.0");
        jdbcTemplate.execute("ALTER TABLE rooms ALTER COLUMN price SET NOT NULL");

        reservationSchemaAlignment.run(new DefaultApplicationArguments(new String[0]));

        Integer nullablePrice = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'ROOMS'
                  AND COLUMN_NAME = 'PRICE'
                  AND IS_NULLABLE = 'YES'
                """,
                Integer.class);

        Room created = roomRepository.saveAndFlush(new Room("777", roomType, 7, RoomStatus.AVAILABLE));

        assertEquals(1, nullablePrice);
        assertNotNull(created.getId());
    }

    @Test
    void convertsBinaryStaffAndUserColumnsBackToTextForSearch() throws Exception {
        User user = new User("alice@roomify.com", "hashed-password", Role.STAFF, true);
        Staff staff = new Staff(user, "Alice Johnson", "Front Desk");
        user.setStaff(staff);
        userRepository.save(user);

        jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN email SET DATA TYPE VARBINARY");
        jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN password_hash SET DATA TYPE VARBINARY");
        jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN role SET DATA TYPE VARBINARY");
        jdbcTemplate.execute("ALTER TABLE staff ALTER COLUMN name SET DATA TYPE VARBINARY");
        jdbcTemplate.execute("ALTER TABLE staff ALTER COLUMN department SET DATA TYPE VARBINARY");

        jdbcTemplate.update(
                "UPDATE users SET email = STRINGTOUTF8(?), password_hash = STRINGTOUTF8(?), role = STRINGTOUTF8(?) WHERE id = ?",
                "alice@roomify.com",
                "hashed-password",
                "STAFF",
                user.getId());
        jdbcTemplate.update(
                "UPDATE staff SET name = STRINGTOUTF8(?), department = STRINGTOUTF8(?) WHERE user_id = ?",
                "Alice Johnson",
                "Front Desk",
                user.getId());

        reservationSchemaAlignment.run(new DefaultApplicationArguments(new String[0]));

        List<Staff> byName = staffRepository.searchStaff("alice", Role.STAFF, "Front Desk", true);
        List<Staff> byEmail = staffRepository.searchStaff("roomify.com", Role.STAFF, null, true);

        assertEquals(1, byName.size());
        assertEquals("Alice Johnson", byName.getFirst().getName());
        assertEquals(1, byEmail.size());
        assertFalse(userRepository.findById(byEmail.getFirst().getId()).orElseThrow().getEmail().isBlank());
    }
}
