ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS actual_check_in_date DATE,
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500),
    ADD COLUMN IF NOT EXISTS cancellation_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modification_reason VARCHAR(500);
