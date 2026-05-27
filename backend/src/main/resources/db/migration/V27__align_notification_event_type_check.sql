ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_event_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_event_type_check
    CHECK (event_type IN (
        'SERVICE_REQUEST_CREATED',
        'PAYMENT_INCOMPLETE',
        'PAYMENT_FAILED',
        'RESERVATION_CREATED',
        'RESERVATION_CANCELLED',
        'PAYMENT_COMPLETED',
        'CHECKIN_REMINDER',
        'ROOM_READY',
        'SERVICE_REQUEST_COMPLETED',
        'EMAIL_DELIVERY_FAILED',
        'PASSWORD_RESET',
        'GUEST_ASSISTANT_MESSAGE',
        'GUEST_ASSISTANT_REPLY'
    ));
