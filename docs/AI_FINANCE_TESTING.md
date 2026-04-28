# AI Finance Testing

## Day 1 executed checks
- `mvn.cmd -f backend\pom.xml -DskipTests test-compile`
- Backend startup under `dev-demo` profile against PostgreSQL
- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/dashboard/metrics`
- PostgreSQL count verification for AI reservations, payments, expenses, rooms, and room types
- PostgreSQL overlap query for AI reservations
- Backend restart with AI seed enabled and reset disabled to verify idempotent skip behavior

## Day 1 verified results
- Compile: PASS
- DB startup: PASS
- Manager login: PASS
- Dashboard metrics API: PASS
- AI reservation count: 1400
- AI payment count: 1286
- AI expense count: 240
- AI room count: 48
- AI room type count: 5
- Overbooking validation SQL: PASS (`0` overlaps)
- Idempotency rerun: PASS

## Day 2 backend verification targets
- Data summary API returns deterministic aggregates from seeded data
- Finance summary API matches direct SQL totals for the requested date range
- Revenue trend API matches grouped reservation totals
- Occupancy trend API matches active-room day counts
- Room type revenue API matches grouped reservation revenue by room type
- Training data API exports a stable ML-ready dataset
- FastAPI service responds within configured timeout and returns model metadata

## Day 3 backend verification targets
- Spring Boot -> FastAPI integration succeeds with timeout and error handling
- Fallback response returns when AI service is unavailable
- Manager-only authorization is enforced on AI Finance endpoints
- Security tests cover unauthorized and wrong-role access
- Final fresh DB rehearsal uses the locked `dev-demo` strategy and the AI demo seeder commands from the runbook
