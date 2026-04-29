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

## Pricing recommendation rule
- The ML model predicts revenue and occupancy.
- Pricing recommendations use a bounded business policy based on model predictions, not a pure ML pricing model.
- Current implementation caps adjustments to a conservative range and assigns a simple risk level with a manager-readable reason.

## Limitations
- Future features are derived from recent room-type profiles, so long-horizon forecasting is intentionally simple.
- Revenue is based on non-cancelled `Reservation.totalPrice`, consistent with the current dashboard backend.
- Daily expenses are allocated proportionally by room inventory share because room-type-specific expense attribution is not stored in the Roomify schema.
- `train.py` currently falls back to the local CSV cache when Spring authentication is required. Spring-to-FastAPI authenticated fetching belongs to Day 3 integration.
