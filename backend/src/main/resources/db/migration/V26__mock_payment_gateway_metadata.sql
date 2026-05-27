ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS last_four_digits VARCHAR(4),
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(500),
    ADD COLUMN IF NOT EXISTS refunded_by VARCHAR(255);

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

UPDATE reservations
SET invoice_status = CASE
    WHEN payment_status = 'PAID' THEN 'PAID'
    WHEN payment_status = 'REFUNDED' THEN 'REFUNDED'
    WHEN payment_status = 'FAILED' THEN 'FAILED'
    ELSE 'PENDING'
END
WHERE invoice_status IS NULL OR invoice_status = 'PENDING';
