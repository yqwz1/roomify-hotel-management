ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_status_check
    CHECK (status IN (
        'PENDING',
        'PAYMENT_PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'CHECKED_OUT',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'REFUNDED'
    ));
