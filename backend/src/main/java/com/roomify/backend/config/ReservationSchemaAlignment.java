package com.roomify.backend.config;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class ReservationSchemaAlignment implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ReservationSchemaAlignment.class);
    private static final List<String> LEGACY_ROOM_TYPE_COLUMNS = List.of(
            "room_type",
            "roomtype_id",
            "roomtype",
            "type_id",
            "room_typeid");

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public ReservationSchemaAlignment(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        alignRoomSchema();
        alignStaffAndUserColumns();
        alignReservationColumns();
        backfillReservationFinancials();
    }

    private void alignRoomSchema() {
        if (!tableExists("rooms")) {
            return;
        }

        alignRoomTypeColumn();
        normalizeLegacyRoomStatuses();
        alignRoomStatusConstraint();
        relaxLegacyRoomColumns();
    }

    private void alignRoomTypeColumn() {
        boolean hasCanonicalColumn = columnExists("rooms", "room_type_id");

        if (!hasCanonicalColumn) {
            Optional<String> legacyColumn = findFirstExistingColumn("rooms", LEGACY_ROOM_TYPE_COLUMNS);
            if (legacyColumn.isPresent()) {
                execute("ALTER TABLE rooms RENAME COLUMN " + legacyColumn.get() + " TO room_type_id");
                hasCanonicalColumn = true;
            } else {
                execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type_id BIGINT");
                hasCanonicalColumn = columnExists("rooms", "room_type_id");
            }
        }

        if (!hasCanonicalColumn) {
            return;
        }

        backfillCanonicalRoomTypeColumnFromLegacyForeignKeys();
        backfillCanonicalRoomTypeColumnFromLegacyTypeData();
        execute("ALTER TABLE rooms ALTER COLUMN room_type_id SET NOT NULL");

        if (tableExists("room_types") && !hasImportedKey("rooms", "room_type_id", "room_types")) {
            execute("""
                    ALTER TABLE rooms
                    ADD CONSTRAINT fk_rooms_room_type
                    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
                    """);
        }
    }

    private void normalizeLegacyRoomStatuses() {
        if (!columnExists("rooms", "status")) {
            return;
        }

        execute("UPDATE rooms SET status = 'AVAILABLE' WHERE LOWER(TRIM(status)) = 'available'");
        execute("UPDATE rooms SET status = 'OCCUPIED' WHERE LOWER(TRIM(status)) = 'occupied'");
        execute("""
                UPDATE rooms
                SET status = 'NEEDS_CLEANING'
                WHERE LOWER(TRIM(status)) IN ('needs_cleaning', 'needs cleaning', 'maintenance')
                """);
        execute("""
                UPDATE rooms
                SET status = 'UNDER_MAINTENANCE'
                WHERE LOWER(TRIM(status)) IN ('under_maintenance', 'under maintenance', 'out_of_service', 'out of service')
                """);
        execute("UPDATE rooms SET status = 'NEEDS_CLEANING' WHERE status = 'MAINTENANCE'");
        execute("UPDATE rooms SET status = 'UNDER_MAINTENANCE' WHERE status = 'OUT_OF_SERVICE'");
    }

    private void alignRoomStatusConstraint() {
        if (!columnExists("rooms", "status")) {
            return;
        }

        execute("ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_status_check");
        execute("""
                ALTER TABLE rooms
                ADD CONSTRAINT rooms_status_check
                CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'NEEDS_CLEANING', 'UNDER_MAINTENANCE'))
                """);
    }

    private void relaxLegacyRoomColumns() {
        dropNotNullConstraint("rooms", "price");
        dropNotNullConstraint("rooms", "type");
    }

    private void backfillCanonicalRoomTypeColumnFromLegacyForeignKeys() {
        for (String legacyColumn : LEGACY_ROOM_TYPE_COLUMNS) {
            if (columnExists("rooms", legacyColumn)) {
                execute("""
                        UPDATE rooms
                        SET room_type_id = %s
                        WHERE room_type_id IS NULL
                          AND %s IS NOT NULL
                        """.formatted(legacyColumn, legacyColumn));
            }
        }
    }

    private void backfillCanonicalRoomTypeColumnFromLegacyTypeData() {
        if (!columnExists("rooms", "room_type_id") || !columnExists("rooms", "type") || !tableExists("room_types")) {
            return;
        }

        List<LegacyRoomRow> legacyRows = jdbcTemplate.query("""
                SELECT id, type, price
                FROM rooms
                WHERE room_type_id IS NULL
                  AND type IS NOT NULL
                  AND TRIM(type) <> ''
                ORDER BY id
                """,
                (resultSet, rowNum) -> new LegacyRoomRow(
                        resultSet.getLong("id"),
                        resultSet.getString("type"),
                        resultSet.getBigDecimal("price")));

        for (LegacyRoomRow legacyRow : legacyRows) {
            Long roomTypeId = findRoomTypeIdByName(legacyRow.legacyType()).orElseGet(() -> createRoomTypeFromLegacyRoom(legacyRow));
            jdbcTemplate.update("UPDATE rooms SET room_type_id = ? WHERE id = ?", roomTypeId, legacyRow.roomId());
        }
    }

    private void alignStaffAndUserColumns() {
        alignTextColumn("users", "email", 255);
        alignTextColumn("users", "password_hash", 255);
        alignTextColumn("users", "role", 20);
        alignTextColumn("staff", "name", 100);
        alignTextColumn("staff", "department", 50);
    }

    private void alignTextColumn(String tableName, String columnName, int length) {
        Optional<ColumnMetadata> metadata = findColumn(tableName, columnName);
        if (metadata.isEmpty() || metadata.get().isTextual()) {
            return;
        }

        String conversionSql = buildTextConversionSql(tableName, columnName, length, metadata.get());
        if (conversionSql == null) {
            log.warn("Skipping schema repair for {}.{} with unsupported type {}", tableName, columnName,
                    metadata.get().typeName());
            return;
        }

        execute(conversionSql);
    }

    private void alignReservationColumns() {
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100)");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS actual_check_in_date DATE");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS actual_check_out_at TIMESTAMP");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500)");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_at TIMESTAMP");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS modification_reason VARCHAR(500)");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10, 2) DEFAULT 0.00");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(10, 2) DEFAULT 0.00");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING'");
        execute("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS invoice_finalized BOOLEAN NOT NULL DEFAULT FALSE");
    }

    private void backfillReservationFinancials() {
        execute("UPDATE reservations SET total_paid = 0.00 WHERE total_paid IS NULL OR total_paid < 0.00");
        execute("""
                UPDATE reservations
                SET outstanding_balance =
                    CASE
                        WHEN COALESCE(total_price, 0.00) - COALESCE(total_paid, 0.00) < 0.00 THEN 0.00
                        ELSE COALESCE(total_price, 0.00) - COALESCE(total_paid, 0.00)
                    END
                WHERE outstanding_balance IS NULL OR outstanding_balance < 0.00
                """);
        execute("""
                UPDATE reservations
                SET payment_status =
                    CASE
                        WHEN COALESCE(total_paid, 0.00) > 0.00
                             AND COALESCE(outstanding_balance, 0.00) <= 0.00 THEN 'PAID'
                        WHEN COALESCE(total_paid, 0.00) > 0.00 THEN 'PARTIALLY_PAID'
                        ELSE 'UNPAID'
                    END
                WHERE payment_status IS NULL OR TRIM(payment_status) = ''
                """);
    }

    private String buildTextConversionSql(String tableName, String columnName, int length, ColumnMetadata metadata) {
        if (isPostgres() && "bytea".equalsIgnoreCase(metadata.typeName())) {
            return """
                    ALTER TABLE %s
                    ALTER COLUMN %s TYPE VARCHAR(%d)
                    USING convert_from(%s, 'UTF8')
                    """.formatted(tableName, columnName, length, columnName);
        }

        if (isH2() && metadata.isBinary()) {
            return """
                    ALTER TABLE %s
                    ALTER COLUMN %s SET DATA TYPE VARCHAR(%d)
                    USING UTF8TOSTRING(%s)
                    """.formatted(tableName, columnName, length, columnName);
        }

        if (isPostgres()) {
            return """
                    ALTER TABLE %s
                    ALTER COLUMN %s TYPE VARCHAR(%d)
                    USING CAST(%s AS VARCHAR(%d))
                    """.formatted(tableName, columnName, length, columnName, length);
        }

        return "ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " VARCHAR(" + length + ")";
    }

    private Optional<Long> findRoomTypeIdByName(String roomTypeName) {
        if (!tableExists("room_types") || roomTypeName == null || roomTypeName.isBlank()) {
            return Optional.empty();
        }

        List<Long> ids = jdbcTemplate.query("""
                SELECT id
                FROM room_types
                WHERE LOWER(name) = LOWER(?)
                ORDER BY id
                """,
                (resultSet, rowNum) -> resultSet.getLong("id"),
                roomTypeName.trim());

        return ids.stream().findFirst();
    }

    private Long createRoomTypeFromLegacyRoom(LegacyRoomRow legacyRow) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        BigDecimal basePrice = legacyRow.legacyPrice() != null
                ? legacyRow.legacyPrice().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        int maxGuests = guessMaxGuests(legacyRow.legacyType());

        jdbcTemplate.update(connection -> {
            PreparedStatement preparedStatement = connection.prepareStatement(
                    """
                    INSERT INTO room_types (name, base_price, max_guests, amenities, description)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    new String[] { "id" });
            preparedStatement.setString(1, legacyRow.legacyType().trim());
            preparedStatement.setBigDecimal(2, basePrice);
            preparedStatement.setInt(3, maxGuests);
            preparedStatement.setString(4, "");
            preparedStatement.setString(5, "Migrated from legacy room data");
            return preparedStatement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to create room type for legacy room " + legacyRow.roomId());
        }

        return key.longValue();
    }

    private int guessMaxGuests(String roomTypeName) {
        if (roomTypeName == null) {
            return 2;
        }

        String normalized = roomTypeName.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "single" -> 1;
            case "double", "standard", "standard room", "deluxe", "deluxe room" -> 2;
            case "suite" -> 4;
            case "family", "family room" -> 5;
            default -> 2;
        };
    }

    private boolean tableExists(String tableName) {
        return withConnection(connection -> findTable(connection, tableName).isPresent());
    }

    private boolean columnExists(String tableName, String columnName) {
        return findColumn(tableName, columnName).isPresent();
    }

    private Optional<String> findFirstExistingColumn(String tableName, List<String> candidates) {
        return candidates.stream()
                .filter(columnName -> columnExists(tableName, columnName))
                .findFirst();
    }

    private Optional<ColumnMetadata> findColumn(String tableName, String columnName) {
        return withConnection(connection -> {
            Optional<String> resolvedTable = findTable(connection, tableName);
            if (resolvedTable.isEmpty()) {
                return Optional.empty();
            }

            DatabaseMetaData metadata = connection.getMetaData();
            for (String candidateColumn : candidateNames(columnName)) {
                try (ResultSet columns = metadata.getColumns(connection.getCatalog(), null, resolvedTable.get(),
                        candidateColumn)) {
                    if (columns.next()) {
                        return Optional.of(new ColumnMetadata(
                                columns.getString("TABLE_NAME"),
                                columns.getString("COLUMN_NAME"),
                                columns.getInt("DATA_TYPE"),
                                columns.getString("TYPE_NAME")));
                    }
                }
            }
            return Optional.empty();
        });
    }

    private Optional<String> findTable(Connection connection, String tableName) throws Exception {
        DatabaseMetaData metadata = connection.getMetaData();
        for (String candidateTable : candidateNames(tableName)) {
            try (ResultSet tables = metadata.getTables(connection.getCatalog(), null, candidateTable,
                    new String[] { "TABLE" })) {
                if (tables.next()) {
                    return Optional.of(tables.getString("TABLE_NAME"));
                }
            }
        }
        return Optional.empty();
    }

    private boolean hasImportedKey(String tableName, String columnName, String referencedTableName) {
        return withConnection(connection -> {
            Optional<String> resolvedTable = findTable(connection, tableName);
            if (resolvedTable.isEmpty()) {
                return false;
            }

            DatabaseMetaData metadata = connection.getMetaData();
            try (ResultSet foreignKeys = metadata.getImportedKeys(connection.getCatalog(), null, resolvedTable.get())) {
                while (foreignKeys.next()) {
                    String fkColumn = foreignKeys.getString("FKCOLUMN_NAME");
                    String pkTable = foreignKeys.getString("PKTABLE_NAME");
                    if (columnName.equalsIgnoreCase(fkColumn) && referencedTableName.equalsIgnoreCase(pkTable)) {
                        return true;
                    }
                }
            }

            return false;
        });
    }

    private void dropNotNullConstraint(String tableName, String columnName) {
        if (!columnExists(tableName, columnName)) {
            return;
        }

        if (isPostgres()) {
            execute("ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " DROP NOT NULL");
            return;
        }

        execute("ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " SET NULL");
    }

    private boolean isPostgres() {
        return databaseProductName().contains("postgresql");
    }

    private boolean isH2() {
        return databaseProductName().contains("h2");
    }

    private String databaseProductName() {
        return withConnection(connection -> connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT));
    }

    private List<String> candidateNames(String identifier) {
        return List.of(identifier, identifier.toLowerCase(Locale.ROOT), identifier.toUpperCase(Locale.ROOT));
    }

    private <T> T withConnection(ConnectionCallback<T> callback) {
        try (Connection connection = dataSource.getConnection()) {
            return callback.execute(connection);
        } catch (Exception ex) {
            log.debug("Schema alignment metadata lookup failed", ex);
            throw new IllegalStateException("Unable to inspect runtime schema", ex);
        }
    }

    private void execute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.debug("Reservation schema alignment skipped statement: {}", sql, ex);
        }
    }

    private record ColumnMetadata(String tableName, String columnName, int jdbcType, String typeName) {
        private boolean isTextual() {
            if (jdbcType == Types.CHAR
                    || jdbcType == Types.VARCHAR
                    || jdbcType == Types.LONGVARCHAR
                    || jdbcType == Types.NCHAR
                    || jdbcType == Types.NVARCHAR
                    || jdbcType == Types.LONGNVARCHAR
                    || jdbcType == Types.CLOB
                    || jdbcType == Types.NCLOB) {
                return true;
            }

            String normalizedType = typeName == null ? "" : typeName.toLowerCase(Locale.ROOT);
            return normalizedType.contains("char")
                    || normalizedType.contains("text")
                    || normalizedType.contains("clob");
        }

        private boolean isBinary() {
            if (jdbcType == Types.BINARY
                    || jdbcType == Types.VARBINARY
                    || jdbcType == Types.LONGVARBINARY
                    || jdbcType == Types.BLOB) {
                return true;
            }

            String normalizedType = typeName == null ? "" : typeName.toLowerCase(Locale.ROOT);
            return normalizedType.contains("binary")
                    || normalizedType.equals("bytea")
                    || normalizedType.contains("blob");
        }
    }

    private record LegacyRoomRow(Long roomId, String legacyType, BigDecimal legacyPrice) {
    }

    @FunctionalInterface
    private interface ConnectionCallback<T> {
        T execute(Connection connection) throws Exception;
    }
}
