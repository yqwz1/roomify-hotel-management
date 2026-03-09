# Day 6 - QA and Demo Script

Date: March 9, 2026
Coordinator: Wahib

## Regression Scope
- Existing:
  - Reservation create
  - Reservation search/lookup
- New:
  - Check-in
  - Cancel
  - Modify

## QA Results Snapshot
- Backend: `ReservationServiceTest`, `ReservationServiceIT`, `ReservationIntegrationTest` passed.
- Frontend: `npm test -- --run` passed.
- Frontend build: `npm run build` passed.
- Error payload spot-check: 404 and 409 responses verified with `status/error/message/path`.

## Demo Plan (2 Minutes Per Flow)

### 1) Lookup + Check-in (Speaker: Eyed)
- Open check-in page
- Search by confirmation number
- Show successful check-in
- Show blocked case (room not ready or reservation not confirmed)
- Highlight audit entry expectation (`ROOM_STATUS_CHANGE`)

### 2) Cancel (Speaker: Wahib)
- Lookup reservation
- Submit cancellation with optional reason
- Show status becomes `CANCELLED`
- Show email log attempt (`SENT` and mention failure path is non-blocking)

### 3) Modify (Speaker: Mohammed)
- Lookup reservation
- Change dates and room
- Show recalculated price
- Show overlap conflict case (`409 Conflict`)
- Show clear conflict message in UI

### 4) Logging and Hardening Summary (Speaker: Abdualrhman)
- Show email log fields (`recipient`, `subject`, `status`, `confirmationNumber`)
- Show audit actions tracked for reservation workflows
- Confirm standardized error payload shape

## Demo Notes
- Start with manager account session.
- Keep one pre-seeded confirmed reservation ready for each flow.
- Keep one overlapping reservation ready for modify conflict demo.