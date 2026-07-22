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

## Day 3 Verification
- Verification date: `2026-04-30`
- Backend compile result: PASS
  - `cd backend`
  - `mvn.cmd clean test-compile`
  - `mvn.cmd test-compile`
- Existing backend integration test: PASS
  - `mvn.cmd "-Dtest=AiFinanceIntegrationTest" test`
- FastAPI ON through Spring Boot: PASS
  - `GET /api/ai-finance/health` -> `200`, `status=UP`
  - `GET /api/ai-finance/model-info` -> `200`, `modelType=RandomForestRegressor`, `trainingRows=2410`, `revenueMae=20.1108`, `occupancyMae=6.6309`
  - `GET /api/ai-finance/revenue-forecast` -> `200`, `source=FASTAPI_MODEL`, `forecastDays=30`, `predictedRevenueTotal=190297.87`, `predictedAverageOccupancy=20.62`, `points=30`
  - `GET /api/ai-finance/pricing-recommendations` -> `200`, `source=FASTAPI_MODEL`, `pricingRecommendations=5`
  - `POST /api/ai-finance/ask` `REVENUE_FORECAST` -> `200`, `source=FASTAPI_MODEL`
  - `POST /api/ai-finance/ask` `PRICING_RECOMMENDATION` -> `200`, `source=FASTAPI_MODEL`
  - `POST /api/ai-finance/ask` `OCCUPANCY_ANALYSIS` -> `200`, `source=FASTAPI_MODEL`
  - `POST /api/ai-finance/ask` `ROOM_TYPE_PERFORMANCE` -> `200`, `source=SPRING_ANALYTICS`
  - `POST /api/ai-finance/ask` `UNKNOWN` -> `400` with supported intents list
- FastAPI OFF fallback through Spring Boot: PASS
  - FastAPI process stopped while Spring Boot remained running
  - `GET /api/ai-finance/health` -> `200`, `status=DOWN`, `fallbackAvailable=true`
  - `GET /api/ai-finance/revenue-forecast` -> `200`, `source=SAFE_DEMO_FALLBACK`, warning present
  - `GET /api/ai-finance/pricing-recommendations` -> `200`, `source=SAFE_DEMO_FALLBACK`, warning present
  - `POST /api/ai-finance/ask` `REVENUE_FORECAST` -> `200`, `source=SAFE_DEMO_FALLBACK`

- Ask endpoint verification: PASS
  - `REVENUE_FORECAST` answer used forecast totals and occupancy
  - `PRICING_RECOMMENDATION` answer summarized live room-type pricing guidance
  - `OCCUPANCY_ANALYSIS` answer summarized forecast occupancy and confidence
  - `ROOM_TYPE_PERFORMANCE` answer summarized Spring analytics room-type revenue
- Security tests: PASS with current demo setup
  - Manager token: all required endpoints returned `200`
  - No token: all required endpoints returned `401`
  - Staff token: NOT_AVAILABLE
  - Guest token: NOT_AVAILABLE
  - Reason: this Day 3 runtime used `roomify.ai-finance.demo-seed-enabled=true` but did not enable the separate `roomify.demo.bootstrap.enabled` profile flag that provisions `staff@roomify.com` and `demo.guest@roomify.dev`
- Final rehearsal: PASS
  - PostgreSQL reachable on `localhost:5432`
  - Spring Boot running on `http://localhost:8080`
  - FastAPI running on `http://localhost:8000`
  - Manager login worked with seeded real admin credentials
  - Day 2 endpoints still worked: `data-summary`, `training-data`
  - Day 3 endpoints worked with FastAPI ON
  - FastAPI stop triggered deterministic safe fallback
  - FastAPI restart returned Spring health to `UP`
- Known warnings
  - `train.py` still prefers the Spring training-data endpoint first, but when Spring auth blocks anonymous access it falls back to `ai-service/data/training_data.csv`. That remains acceptable for the standalone trainer.
  - Backend test output still shows unrelated legacy warnings from Lombok, Mockito, and older test classes. No Day 3 failures were caused by them.

## Current v2 model verification

- Verification date: `2026-07-22`
- Training: PASS using the cached synthetic CSV after the authenticated Spring export returned `401`
- Model: `ai-finance-v2`, `4386` rows, date range `2024-05-21` to `2026-05-21`
- Evaluation: chronological 80/20 holdout plus three rolling-origin folds; the final artifacts are then refit on all rows
- Holdout revenue: MAE `0.6276`, RMSE `9.2345`, R² `0.9999`, room-type-median baseline MAE `314.0550`
- Holdout occupancy: MAE `0.0815`, RMSE `0.5271`, R² `0.9996`, room-type-median baseline MAE `13.9078`
- Forecast contract: PASS with per-day lower/upper revenue and occupancy bounds plus an `80%` tree-spread level
- Python model tests: PASS (`3` tests)
- React forecast-chart tests: PASS (`2` tests)
- Frontend production build: PASS
- Spring `AiFinanceIntegrationTest`: PASS
- These unusually strong metrics describe the deterministic synthetic demo dataset only and must not be generalized to production hotel data.

## Frontend smoke test checklist

Use this checklist after starting Spring Boot, the React app, and FastAPI when available.

- Login as a Manager.
- Open `/manager/ai-finance`.
- Confirm the AI Status section is visible and shows model/service state.
- Confirm Data Summary cards are visible: Reservations, Revenue, Occupancy, Expenses, Room Types, Top Room Type.
- Confirm historical revenue chart is visible and labeled as historical context.
- Confirm historical occupancy chart is visible and labeled as historical context.
- Confirm Revenue Forecast section is visible and shows future prediction metrics when `/api/ai-finance/revenue-forecast` returns data.
- Confirm Occupancy Forecast section is visible and shows future prediction metrics when forecast points are available.
- Confirm Pricing Recommendations section shows advisory room-type cards when `/api/ai-finance/pricing-recommendations` returns data.
- Confirm AI Insights panel is visible.
- Click the four predefined AI insight buttons:
  - Forecast next 30 days revenue.
  - Recommend prices for next week.
  - Analyze occupancy trend.
  - Show best performing room type.
- Confirm fallback banner appears when Spring returns `source=SAFE_DEMO_FALLBACK` or a `warning`.
- Confirm no fatal console errors appear during the demo path.
- Confirm the dashboard remains readable on laptop and mobile-width viewports.
- Confirm Staff and Guest users do not see Manager AI Finance navigation.
- Confirm unauthenticated users cannot access `/manager/ai-finance`.

## Frontend verification status

- Code inspection verified React calls Spring Boot AI Finance endpoints only.
- Code inspection verified no direct FastAPI URL is used in React.
- Code inspection verified `/manager/ai-finance` remains wrapped in Manager-only route protection.
- Runtime browser smoke test: PASS on `/manager/ai-finance`; both forecast charts rendered the `80% model spread interval` label and the interval explanation.
- Final security matrix remains pending for Staff, Guest, and unauthenticated browser sessions unless the local demo users are provisioned.

## Backend Test Verification
- Exact failing test: Application context load fails for multiple tests (e.g., `HealthControllerTest`, `StaffIntegrationTest`).
- Exact error: `Failed to execute script V6__seed_test_reservations.sql` (SQL State 42S02: Table "GUESTS" not found).
- Why it is unrelated or still acceptable: `V6__seed_test_reservations.sql` attempts to insert into `guests` and `reservations` tables which are generated by Hibernate (`ddl-auto=create-drop`). Because Flyway runs before Hibernate in the H2 test environment, the tables do not exist yet. This is an existing flaw in the test DDL lifecycle and unrelated to the new AI Finance features.
- Which AI Finance smoke checks passed: Manual endpoint integration tests and AI Finance fallback verifications passed in previous audits.
