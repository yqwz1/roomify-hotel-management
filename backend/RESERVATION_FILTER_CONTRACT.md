# Reservation List Filter Contract

Endpoint: `GET /api/reservations`

## Optional Query Parameters
- `confirmation` (string): exact reservation confirmation number match, case-insensitive.
- `guestName` (string): partial guest name match, case-insensitive.
- `status` (enum): one of `PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`.
- `checkInDate` (date): exact check-in date match (`yyyy-MM-dd`).
- `checkOutDate` (date): exact check-out date match (`yyyy-MM-dd`).

## Combination Rules
- All parameters are optional.
- Any provided parameters are combined with logical `AND`.
- If a parameter is omitted (or blank for string params), it is ignored.
- If no parameters are provided, behavior is unchanged: returns the same unfiltered reservation list as before.

## Example Queries
- `GET /api/reservations`
- `GET /api/reservations?confirmation=RSV-ABC123DEF456`
- `GET /api/reservations?guestName=moaz`
- `GET /api/reservations?status=CONFIRMED&checkInDate=2026-04-20`
- `GET /api/reservations?guestName=ali&status=CHECKED_IN&checkOutDate=2026-04-22`

## Frontend Integration Notes
- Frontend can start sending any subset of these query params immediately.
- Existing consumers that call `GET /api/reservations` with no params are fully compatible.
