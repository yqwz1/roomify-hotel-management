package com.roomify.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ReservationSchemaAlignment implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ReservationSchemaAlignment.class);

    private final JdbcTemplate jdbcTemplate;

    public ReservationSchemaAlignment(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        alignReservationColumns();
        backfillReservationFinancials();
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

    private void execute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.debug("Reservation schema alignment skipped statement: {}", sql, ex);
        }
    }
}
