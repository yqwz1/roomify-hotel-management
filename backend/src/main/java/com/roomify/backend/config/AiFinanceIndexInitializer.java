package com.roomify.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@ConditionalOnProperty(value = "roomify.ai-finance.enabled", havingValue = "true", matchIfMissing = true)
public class AiFinanceIndexInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AiFinanceIndexInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public AiFinanceIndexInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        createIndex("CREATE INDEX IF NOT EXISTS idx_reservations_check_in_date ON reservations(check_in_date)");
        createIndex("CREATE INDEX IF NOT EXISTS idx_reservations_check_out_date ON reservations(check_out_date)");
        createIndex("CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)");
        createIndex("CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id)");
        createIndex("CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)");
        createIndex("CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date)");
        createIndex("CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id)");
    }

    private void createIndex(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.debug("Skipping AI Finance index statement: {}", sql, ex);
        }
    }
}
