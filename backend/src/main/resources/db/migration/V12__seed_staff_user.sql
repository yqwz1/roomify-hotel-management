-- ============================================================
-- V12__seed_staff_user.sql
-- Seed a default STAFF user for dashboard access testing.
-- Plain-text password: password123
-- BCrypt hash (cost 10): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVKqpVQBby
-- ============================================================

-- 1. Insert the staff user into the users table.
--    Column names confirmed from V1__create_users_table.sql and User.java:
--      email, password_hash, role, is_active
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
    'staff@roomify.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVKqpVQBby',
    'STAFF',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert the matching row into user_roles.
--    Table schema confirmed from V8 migration:
--      user_roles(user_id BIGINT, role VARCHAR(20)), PK (user_id, role)
--    User.java uses @ElementCollection on Set<Role> mapped to this table.
INSERT INTO user_roles (user_id, role)
SELECT id, 'STAFF'
FROM   users
WHERE  email = 'staff@roomify.com'
  AND  NOT EXISTS (
      SELECT 1
      FROM   user_roles ur
      WHERE  ur.user_id = (SELECT id FROM users WHERE email = 'staff@roomify.com')
        AND  ur.role    = 'STAFF'
  );