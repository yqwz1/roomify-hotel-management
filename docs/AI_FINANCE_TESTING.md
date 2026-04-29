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

## Day 2 Verification
- Backend compile result: PASS (`mvn.cmd clean test-compile` on April 29, 2026)
- Backend endpoint test result: PASS
- `AiFinanceIntegrationTest`: PASS
- `GET /api/ai-finance/data-summary`: PASS
- `GET /api/ai-finance/summary`: PASS
- `GET /api/ai-finance/revenue-trend?start=2025-01-01&end=2026-04-27`: PASS
- `GET /api/ai-finance/occupancy-trend?start=2025-01-01&end=2026-04-27`: PASS
- `GET /api/ai-finance/room-type-revenue`: PASS
- `GET /api/ai-finance/training-data?start=2025-01-01&end=2026-04-27`: PASS
- `GET /api/ai-finance/training-data.csv`: PASS
- Training data row count for the Day 2 ML window: `2410`
- Training data validation:
  - invalid revenue rows: `0`
  - invalid occupancy rows: `0`
  - invalid `totalRooms <= 0` rows: `0`
  - invalid cancelled-booking rows: `0`
- FastAPI dependency install result: PASS (`pip install -r requirements.txt`)
- `python train.py`: PASS
- Training mode:
  - API-first attempt returned `401` because Spring auth is required
  - local CSV fallback succeeded as designed
- Model artifacts created:
  - `ai-service/models/revenue_model.joblib`
  - `ai-service/models/occupancy_model.joblib`
  - `ai-service/models/model_metadata.json`
  - `ai-service/models/reference_data.csv`
- `GET http://localhost:8000/health`: PASS
- `GET http://localhost:8000/model-info`: PASS
- `POST http://localhost:8000/forecast/full`: PASS
- `POST http://localhost:8000/pricing/recommendations`: PASS
- Blockers:
  - None for Day 2 delivery
  - Day 3 still needs authenticated Spring Boot to FastAPI integration instead of manual CSV fallback support

## Day 3 backend verification targets
- Spring Boot -> FastAPI integration succeeds with timeout and error handling
- Fallback response returns when AI service is unavailable
- Manager-only authorization is enforced on AI Finance endpoints
- Security tests cover unauthorized and wrong-role access
- Final fresh DB rehearsal uses the locked `dev-demo` strategy and the AI demo seeder commands from the runbook
