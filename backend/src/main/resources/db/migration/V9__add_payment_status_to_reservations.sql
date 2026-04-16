ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

UPDATE reservations
SET payment_status = 'PENDING'
WHERE payment_status IS NULL;
