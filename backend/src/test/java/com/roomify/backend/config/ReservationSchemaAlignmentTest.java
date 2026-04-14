package com.roomify.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}
