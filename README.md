# Roomify Hotel Management

Roomify is a hotel operations system with a Spring Boot backend and React frontend.

## Day 5-7 Hardening Status (March 9, 2026)

The reservation management flows were hardened and re-verified:
- Lookup -> check-in (success and blocked scenarios)
- Cancel -> status transition + email delivery log (including failed delivery logging)
- Modify -> availability conflict handling + price recalculation + email delivery log
- Error responses normalized through the shared `ApiError` payload shape

## Core Reservation Endpoints

Base path: `/api/reservations`

- `POST /api/reservations` (ROLE_MANAGER, ROLE_STAFF)
  - Creates reservation
  - Returns pricing breakdown and confirmation number
- `GET /api/reservations/search?confirmation=...|guestName=...` (ROLE_MANAGER, ROLE_STAFF)
  - Reservation lookup for staff workflows
- `GET /api/reservations/{confirmationNumber}` (ROLE_MANAGER, ROLE_STAFF)
  - Retrieve reservation details by confirmation number
- `POST /api/reservations/check-in/{confirmationNumber}` (ROLE_MANAGER, ROLE_STAFF)
  - Check-in by confirmation number
- `POST /api/reservations/{id}/cancel` (ROLE_MANAGER, ROLE_STAFF)
  - Cancel reservation
- `PUT /api/reservations/{id}` (ROLE_MANAGER, ROLE_STAFF)
  - Modify reservation dates and/or room

## Key Validation and Business Rules

- Create:
  - Check-out must be after check-in
  - Room overlap is rejected with `409 Conflict`
  - Initial status defaults to `PENDING` unless explicitly provided as `PENDING` or `CONFIRMED`
- Check-in:
  - Only `CONFIRMED` reservations can check in
  - Cannot check in before scheduled check-in date
  - Room must be `AVAILABLE`
  - On success, reservation becomes `CHECKED_IN`, room becomes `OCCUPIED`, audit entry is written
- Cancel:
  - Blocked for `CHECKED_IN` and `CHECKED_OUT`
  - Stores `cancellationAt` and optional trimmed `cancellationReason`
  - Cancellation email is attempted; failures do not block cancellation
- Modify:
  - Availability validated using overlap check excluding current reservation
  - Recalculates total price from selected room rate + tax
  - Stores optional trimmed `modificationReason`
  - Modification email is attempted; failures do not block modification

## Error Payload Shape

Errors use the shared `ApiError` object:

```json
{
  "timestamp": "2026-03-09T07:00:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Selected room is not available for the requested dates",
  "path": "/api/reservations/71"
}
```

Validation errors include `validationErrors`.

## Logging and Audit Expectations

- Email attempts are logged to `email_log` with:
  - recipient, subject, confirmationNumber, status (`SENT` or `FAILED`), errorMessage
- Reservation workflow audit entries include:
  - `ROOM_STATUS_CHANGE` on successful check-in
  - `RESERVATION_CANCELLED` on cancel
  - `RESERVATION_MODIFIED` on modify

## Test and Verification Commands

Backend targeted hardening suite:

```bash
cd backend
mvn -B "-Dtest=ReservationServiceTest,ReservationServiceIT,ReservationIntegrationTest" test
```

Frontend regression:

```bash
cd frontend
npm test -- --run
npm run build
```

## Known Issues

- Frontend test suite reports non-blocking React `act(...)` warnings in `App.test.jsx`.
- Root-level operational docs for non-reservation modules are still sparse and can be expanded in a follow-up pass.