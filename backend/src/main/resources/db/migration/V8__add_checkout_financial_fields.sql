ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS actual_check_out_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS invoice_finalized BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE reservations
SET outstanding_balance = COALESCE(total_price, 0.00) - COALESCE(total_paid, 0.00)
WHERE outstanding_balance IS NULL OR outstanding_balance < 0.00;

UPDATE reservations
SET outstanding_balance = 0.00
WHERE outstanding_balance < 0.00;
