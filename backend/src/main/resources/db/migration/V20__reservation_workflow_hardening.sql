ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS payment_timestamp TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS staff_notes VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS reservation_history (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    note VARCHAR(1000),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservation_history_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_history_reservation_id
    ON reservation_history(reservation_id);

CREATE TABLE IF NOT EXISTS reservation_audits (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    details VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservation_audits_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_audits_reservation_id
    ON reservation_audits(reservation_id);