# Endpoint Role Map

## Public Endpoints
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

## Reservation Endpoints
- `POST /api/reservations` -> `ROLE_MANAGER`, `ROLE_STAFF`
- `GET /api/reservations/search` -> `ROLE_MANAGER`, `ROLE_STAFF`
- `GET /api/reservations/{confirmationNumber}` -> `ROLE_MANAGER`, `ROLE_STAFF`
- `POST /api/reservations/check-in/{confirmationNumber}` -> `ROLE_MANAGER`, `ROLE_STAFF`
- `POST /api/reservations/{id}/cancel` -> `ROLE_MANAGER`, `ROLE_STAFF`
- `PUT /api/reservations/{id}` -> `ROLE_MANAGER`, `ROLE_STAFF`

## Notes
- Reservation routes are guarded at controller level with:
  - `@PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")`
- `ROLE_GUEST` is intentionally blocked from reservation staff operations.