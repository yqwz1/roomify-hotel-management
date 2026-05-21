CREATE TABLE IF NOT EXISTS email_notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(120) NOT NULL,
    template_payload TEXT NOT NULL,
    reference_type VARCHAR(60),
    reference_id VARCHAR(120),
    idempotency_key VARCHAR(255) UNIQUE,
    locale_tag VARCHAR(16) NOT NULL DEFAULT 'en',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    last_attempt_at TIMESTAMP,
    next_attempt_at TIMESTAMP,
    error_message VARCHAR(1000)
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_next_attempt_at ON email_notifications(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(type);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

ALTER TABLE notifications
    ALTER COLUMN target_role DROP NOT NULL;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON notifications(recipient_email);
