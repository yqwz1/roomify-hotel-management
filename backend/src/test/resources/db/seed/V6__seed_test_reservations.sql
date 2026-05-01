-- V6: Seed reservation data for testing availability search overlap logic
-- ─────────────────────────────────────────────────────────────────────────────
-- These records let you verify that:
--   1. Rooms with CONFIRMED/PENDING reservations overlapping your search dates
--      are properly excluded from GET /api/rooms/search results.
--   2. Rooms with only CANCELLED reservations still appear (cancelled don't block).
--   3. Rooms with reservations that don't overlap your search dates still appear.
--
-- Safe to run repeatedly — uses INSERT ... WHERE NOT EXISTS to avoid duplicates.
--
-- Assumes rooms with room_number '101','102','201','202' and guests exist.
-- If your dev DB has different room numbers, adjust accordingly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: ensure a test guest exists ───────────────────────────────────────
INSERT INTO guests (first_name, last_name, email, phone, created_at)
SELECT 'Test', 'Guest', 'testguest@roomify.dev', '+1-555-0100', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM guests WHERE email = 'testguest@roomify.dev'
);

-- ── Reservation 1: CONFIRMED, covers Mar 1-5, 2026 (room 101) ────────────────
-- Search for Mar 2–4 → room 101 should be EXCLUDED.
INSERT INTO reservations (
    guest_id, room_id,
    check_in_date, check_out_date,
    total_price, status, confirmation_number, created_at
)
SELECT
    g.id,
    r.id,
    '2026-03-01', '2026-03-05',
    399.96, 'CONFIRMED', 'CONF-SEED-001', NOW()
FROM guests g
CROSS JOIN rooms r
WHERE g.email = 'testguest@roomify.dev'
  AND r.room_number = '101'
  AND NOT EXISTS (
      SELECT 1 FROM reservations WHERE confirmation_number = 'CONF-SEED-001'
  );

-- ── Reservation 2: CONFIRMED, covers Mar 10-15, 2026 (room 102) ──────────────
-- Search for Mar 10–12 → room 102 should be EXCLUDED.
INSERT INTO reservations (
    guest_id, room_id,
    check_in_date, check_out_date,
    total_price, status, confirmation_number, created_at
)
SELECT
    g.id,
    r.id,
    '2026-03-10', '2026-03-15',
    749.95, 'CONFIRMED', 'CONF-SEED-002', NOW()
FROM guests g
CROSS JOIN rooms r
WHERE g.email = 'testguest@roomify.dev'
  AND r.room_number = '102'
  AND NOT EXISTS (
      SELECT 1 FROM reservations WHERE confirmation_number = 'CONF-SEED-002'
  );

-- ── Reservation 3: CANCELLED, covers Mar 1-5, 2026 (room 201) ────────────────
-- Search for Mar 2–4 → room 201 should still APPEAR (cancelled don't block).
INSERT INTO reservations (
    guest_id, room_id,
    check_in_date, check_out_date,
    total_price, status, confirmation_number, created_at
)
SELECT
    g.id,
    r.id,
    '2026-03-01', '2026-03-05',
    0.00, 'CANCELLED', 'CONF-SEED-003', NOW()
FROM guests g
CROSS JOIN rooms r
WHERE g.email = 'testguest@roomify.dev'
  AND r.room_number = '201'
  AND NOT EXISTS (
      SELECT 1 FROM reservations WHERE confirmation_number = 'CONF-SEED-003'
  );

-- ── Reservation 4: PENDING, starts after our test window (room 202) ──────────
-- Search for Mar 2–4 → room 202 should APPEAR (reservation starts Mar 20, no overlap).
INSERT INTO reservations (
    guest_id, room_id,
    check_in_date, check_out_date,
    total_price, status, confirmation_number, created_at
)
SELECT
    g.id,
    r.id,
    '2026-03-20', '2026-03-25',
    1249.95, 'PENDING', 'CONF-SEED-004', NOW()
FROM guests g
CROSS JOIN rooms r
WHERE g.email = 'testguest@roomify.dev'
  AND r.room_number = '202'
  AND NOT EXISTS (
      SELECT 1 FROM reservations WHERE confirmation_number = 'CONF-SEED-004'
  );
