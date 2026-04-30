# AI Finance Model

## Objective
- Forecast short-horizon revenue
- Forecast short-horizon occupancy
- Provide bounded pricing recommendations for managers

## Actual Day 2 model implementation
- Model type: `RandomForestRegressor`
- Revenue target: `dailyRevenue`
- Occupancy target: `occupancyRate`
- Saved model version: `ai-finance-v1`

## Training data
- Source priority:
  1. Spring Boot `GET /api/ai-finance/training-data?start=2025-01-01&end=2026-04-27`
  2. Local fallback CSV: `ai-service/data/training_data.csv`
- Final trained date range: `2025-01-01` to `2026-04-27`
- Final training rows: `2410`
- Granularity: daily, room-type-level

## Features
- `dayOfWeek`
- `month`
- `weekend`
- `roomType`
- `roomTypeId`
- `totalRooms`
- `occupiedRoomNights`
- `confirmedBookings`
- `cancelledBookings`
- `averageRoomPrice`
- `dailyExpenses`
- `occupancyRate`

Notes:
- The shared training dataset includes `occupancyRate`.
- The occupancy model excludes `occupancyRate` from its own feature input to avoid target leakage.

## Targets
- `dailyRevenue`
- `occupancyRate`

## Metrics
- Revenue MAE: `20.1108`
- Occupancy MAE: `6.6309`

## Artifacts
- `ai-service/models/revenue_model.joblib`
- `ai-service/models/occupancy_model.joblib`
- `ai-service/models/model_metadata.json`
- `ai-service/models/reference_data.csv`

## Spring integration status
- Final Day 3 status: integrated
- Spring Boot retrieves FastAPI health, model info, revenue forecast, and pricing recommendations through `AiFinanceClient`
- React consumes Spring Boot endpoints only
- Spring Boot remains the auth and contract boundary

## How Spring retrieves model info and forecast
1. Manager requests Spring Boot `/api/ai-finance/model-info` or `/api/ai-finance/revenue-forecast`
2. `AiFinanceClient` sends HTTP requests to FastAPI using `roomify.ai-service.base-url`
3. Spring applies `roomify.ai-service.timeout-ms`
4. If FastAPI responds successfully, Spring returns the live payload with `source=FASTAPI_MODEL` for forecast and pricing flows
5. If FastAPI is unavailable and fallback is enabled, Spring returns `SAFE_DEMO_FALLBACK` instead of failing the demo

## Fallback note
- Fallback is deterministic demo data loaded from `backend/src/main/resources/demo/ai-finance-fallback.json`
- It is not a cache
- It is not a last-successful forecast replay
- Spring returned the fallback successfully during the verified FastAPI-OFF rehearsal on `2026-04-30`

## Final model artifact verification
- `python train.py`: PASS on `2026-04-30`
- `ai-service/models/revenue_model.joblib`: verified present
- `ai-service/models/occupancy_model.joblib`: verified present
- `ai-service/models/model_metadata.json`: verified present
- `ai-service/models/reference_data.csv`: verified present
- `GET /api/ai-finance/model-info` through Spring: PASS
- `GET /api/ai-finance/revenue-forecast` through Spring: PASS
- `GET /api/ai-finance/pricing-recommendations` through Spring: PASS

## Pricing recommendation rule
- The ML model predicts revenue and occupancy.
- Pricing recommendations use a bounded business policy based on model predictions, not a pure ML pricing model.
- Current implementation caps adjustments to a conservative range and assigns a simple risk level with a manager-readable reason.

## Limitations
- Future features are derived from recent room-type profiles, so long-horizon forecasting is intentionally simple.
- Revenue is based on non-cancelled `Reservation.totalPrice`, consistent with the current dashboard backend.
- Daily expenses are allocated proportionally by room inventory share because room-type-specific expense attribution is not stored in the Roomify schema.
- `train.py` still falls back to the local CSV when anonymous access to Spring training-data is blocked. Day 3 completed Spring-to-FastAPI inference integration, but the standalone trainer still uses the existing CSV fallback path.
