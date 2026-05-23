-- ============================================================
-- V22__align_demo_passwords.sql
-- Unlock all demo accounts and align their passwords:
--   - admin@roomify.com -> RealAdminPass123!
--   - manager@roomify.com -> Demo@2026
--   - staff@roomify.com -> Demo@2026
--   - guest@roomify.com -> Demo@2026
-- ============================================================

UPDATE users 
SET failed_attempts = 0, 
    lock_until = NULL, 
    is_active = true,
    password_hash = CASE 
        WHEN email = 'admin@roomify.com' THEN '$2a$10$FNNzf/9ZfVkLsKXhWekEw.N5pyjdpRvrfNQdRsMhw9sapyIMPBH0i'
        ELSE '$2a$10$lhfnlq7MALiKCJlu9iuRdu64CiVIMThYl44yfkEWybLzk2UlZRah2'
    END
WHERE email in ('admin@roomify.com', 'manager@roomify.com', 'staff@roomify.com', 'guest@roomify.com');
