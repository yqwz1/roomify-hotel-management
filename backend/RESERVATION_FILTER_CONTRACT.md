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

## Guest-Name Multi-Match Behavior
- `GET /api/reservations?guestName=...` returns all matching reservations for explicit staff selection.
- Guest-name matches are sorted by `checkInDate DESC`, then `confirmationNumber ASC`, so repeated searches stay stable.
- `GET /api/reservations/search?guestName=...` is treated as a single-result lookup only.
- If that single-result lookup finds multiple matches, the backend returns `409 Conflict` and the client should fall back to the filtered list endpoint above.

## Example Queries
- `GET /api/reservations`
- `GET /api/reservations?confirmation=RSV-ABC123DEF456`
- `GET /api/reservations?guestName=moaz`
- `GET /api/reservations?status=CONFIRMED&checkInDate=2026-04-20`
- `GET /api/reservations?guestName=ali&status=CHECKED_IN&checkOutDate=2026-04-22`

## Frontend Integration Notes
- Frontend can start sending any subset of these query params immediately.
- Guest-name search should call `GET /api/reservations?guestName=...` instead of fetching the full list and filtering in the browser.
- Confirmation-first search can stay on `GET /api/reservations/search?confirmation=...` for exact lookup flows.
- Existing consumers that call `GET /api/reservations` with no params are fully compatible.
