# AI Finance Architecture

## Final frontend integration path

The AI Finance frontend uses this path for all live AI feature data:

React `/manager/ai-finance` -> Spring Boot `/api/ai-finance/*` -> FastAPI AI service -> trained ML artifacts.

React does not call FastAPI directly. Spring Boot is the only API boundary used by the browser because it already owns authentication, Manager-only authorization, Roomify business data, timeout handling, and fallback behavior.

## Layer responsibilities

- React: renders the Manager-only dashboard, summary cards, historical charts, forecast display, pricing recommendation cards, fallback banner, and predefined AI insight buttons.
- Spring Boot: enforces Manager access, serves finance analytics from Roomify data, calls FastAPI through `AiFinanceClient`, normalizes payloads, and returns safe fallback responses when configured.
- FastAPI: loads trained model artifacts, serves model health/model metadata, forecasts revenue and occupancy, and generates pricing recommendation payloads.
- ML model: predicts revenue and occupancy from realistic historical hotel data.

## Safe fallback behavior

Fallback exists to keep the graduation demo understandable when FastAPI is stopped or unreachable. It is deterministic demo data returned by Spring Boot with `source=SAFE_DEMO_FALLBACK` and a warning. It is not a cached last successful forecast.

## Access control

`/manager/ai-finance` remains a Manager-only route in React, and the Spring Boot controller is protected with Manager role authorization. Staff, Guest, and unauthenticated users should not access the AI Finance page or endpoints.

## Components
- PostgreSQL stores hotel operational and financial history
- Spring Boot owns data aggregation, security, contracts, and fallback behavior
- FastAPI serves training and inference for the lightweight forecasting model
- Frontend manager pages consume Spring Boot AI Finance endpoints

## Day 1 foundation delivered
- Locked `dev-demo` database startup profile
- Safe AI Finance configuration keys
- Runtime index creation for analytics-heavy columns
- Standalone AI Finance demo data seeder
- Historical reservation, payment, and expense generation with overlap prevention
- Runbook documentation and smoke-test verification

## Data flow
1. PostgreSQL stores reservations, payments, expenses, rooms, room types, and guests.
2. React calls Spring Boot only and never calls FastAPI directly.
3. Spring Boot validates access, aggregates analytics, and exposes manager-only endpoints.
4. Spring Boot training-data endpoints prepare ML-ready rows from the historical dataset.
5. `AiFinanceClient` calls FastAPI for health, model info, forecast, and pricing endpoints.
6. FastAPI loads the trained ML artifacts and serves forecast outputs.
7. Spring Boot applies timeout and safe fallback rules before responding to the frontend.

## Day 3 delivered integration layer
- `AiFinanceClient` owns Spring Boot -> FastAPI HTTP calls
- `AiFinanceFallbackService` loads deterministic classpath fallback JSON
- `AiFinanceController` now exposes:
  - `GET /api/ai-finance/health`
  - `GET /api/ai-finance/model-info`
  - `GET /api/ai-finance/revenue-forecast`
  - `GET /api/ai-finance/pricing-recommendations`
  - `POST /api/ai-finance/ask`
- New endpoints remain protected by `@PreAuthorize("hasRole('MANAGER')")`
- Safe fallback uses `source=SAFE_DEMO_FALLBACK`
- If FastAPI is unavailable, Spring Boot stays up and returns controlled responses instead of crashing

## Day 2 delivered backend layer
- `AiFinanceController` exposes:
  - `GET /api/ai-finance/data-summary`
  - `GET /api/ai-finance/summary`
  - `GET /api/ai-finance/revenue-trend`
  - `GET /api/ai-finance/occupancy-trend`
  - `GET /api/ai-finance/room-type-revenue`
  - `GET /api/ai-finance/training-data`
  - `GET /api/ai-finance/training-data.csv`
- `FinanceAnalyticsService` computes:
  - non-cancelled revenue from Roomify reservations
  - occupancy using `CONFIRMED`, `CHECKED_IN`, and `CHECKED_OUT`
  - daily room-type-level ML training rows
- Existing Roomify entities and repositories are reused directly:
  - `Reservation`
  - `Payment`
  - `Expense`
  - `Room`
  - `RoomType`
  - `Guest`

## Day 2 delivered FastAPI layer
- `ai-service/train.py` trains revenue and occupancy regressors
- `ai-service/main.py` serves:
  - `GET /health`
  - `GET /model-info`
  - `POST /forecast/full`
  - `POST /pricing/recommendations`
- `ai-service/model.py` owns normalization, training, artifact loading, future feature generation, forecast aggregation, and bounded pricing policy
- `ai-service/models/model_metadata.json` stores the trained model metadata contract

## Day 2 artifact flow
1. Manager-authenticated Spring Boot endpoints export analytics and training data.
2. `train.py` tries the Spring JSON endpoint first.
3. If Spring auth blocks the standalone trainer, `train.py` falls back to `ai-service/data/training_data.csv`.
4. Trained artifacts are saved under `ai-service/models/`.
5. FastAPI inference endpoints load the saved artifacts on demand.

## Safety rules
- AI demo seeding is disabled by default
- AI demo reset is disabled by default
- Existing `DemoDataBootstrap` stays separate from the AI Finance seeder
- Reset deletes only AI-prefixed records
- The locked DB strategy is profile-based and non-destructive (`ddl-auto=update`)

## Key backend files
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev-demo.properties`
- `backend/src/main/java/com/roomify/backend/config/ReservationSchemaAlignment.java`
- `backend/src/main/java/com/roomify/backend/config/AiFinanceIndexInitializer.java`
- `backend/src/main/java/com/roomify/backend/config/AiFinanceDemoDataSeeder.java`

## AI service integration contract
- Base URL comes from `roomify.ai-service.base-url`
- Timeout comes from `roomify.ai-service.timeout-ms`
- Fallback behavior is controlled by `roomify.ai-service.fallback-enabled`

## Final Day 3 flow
`Frontend -> Spring Boot -> AiFinanceClient -> FastAPI -> ML model -> Spring Boot -> Frontend`

Fallback branch:
`Frontend -> Spring Boot -> AiFinanceFallbackService -> SAFE_DEMO_FALLBACK payload -> Frontend`
