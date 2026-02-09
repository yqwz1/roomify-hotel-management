# Endpoint Role Map

## Public Endpoints
- `GET /api/health` — Public (health check)
- `POST /api/auth/login` — Public (login)
- `POST /api/auth/refresh` — Public (token refresh)

## Protected Endpoints
- None yet. Business endpoints with role requirements have not been added.

## Notes
- When new endpoints are added, document required roles here using:
  - `ROLE_MANAGER` (full access)
  - `ROLE_STAFF` (department-scoped access)
  - `ROLE_GUEST` (guest-facing access)
