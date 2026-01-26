--  Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

--  Insert default Super Admin user
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
    'admin@roomify.com',
    '$2a$10$PLACEHOLDER_HASH_CHANGE_ME',
    'MANAGER',
    TRUE
);
