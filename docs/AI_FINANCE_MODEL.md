# AI Finance Model

## Objective
- Forecast short-horizon revenue
- Forecast short-horizon occupancy
- Provide bounded pricing recommendations for managers

## Current model implementation
- Model type: `RandomForestRegressor`
- Revenue target: `dailyRevenue`
- Occupancy target: `occupancyRate`
- Saved model version: `ai-finance-v2`

## Training data
- Source priority:
  1. Spring Boot `GET /api/ai-finance/training-data` using a rolling two-year date window
  2. Local fallback CSV: `ai-service/data/training_data.csv`
- Final trained date range: `2024-05-21` to `2026-05-21`
- Final training rows: `4386`
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
- Evaluation strategy: chronological 80/20 holdout plus 3-fold rolling-origin validation
- Holdout split date: `2025-12-26`
- Revenue holdout: MAE `0.6276`, RMSE `9.2345`, R² `0.9999`
- Revenue room-type median baseline MAE: `314.0550`
- Revenue rolling-origin MAE: `4.4937`
- Occupancy holdout: MAE `0.0815`, RMSE `0.5271`, R² `0.9996`
- Occupancy room-type median baseline MAE: `13.9078`
- Occupancy rolling-origin MAE: `0.4827`

The dataset is seeded/demo-oriented and highly deterministic. These metrics verify the evaluation workflow but must not be presented as evidence of performance on an independent real-world hotel dataset.

## Prediction intervals
- Each Random Forest tree produces an individual forecast.
- The API returns the 10th and 90th percentiles of those tree predictions as an 80% model-spread interval.
- Daily revenue intervals are aggregated across room types; occupancy intervals are inventory-weighted.
- The React forecast charts render the interval as a shaded band around the point forecast.
- These intervals describe ensemble spread and are not statistically calibrated confidence intervals.

## Inference behavior
- Forecast dates start one day after the later of today's date or the latest reference-data date.
- Model artifacts and reference data are cached in-process after their first load; retraining clears that cache in the trainer process.
- Protected training-data credentials are read from `ROOMIFY_TRAIN_EMAIL` and `ROOMIFY_TRAIN_PASSWORD`, never embedded in source code.

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
- The committed dataset is seeded/demo-oriented; unusually strong metrics should not be generalized to real hotels.
- The 80% interval is based on tree dispersion and is not calibrated for guaranteed coverage.
- Future features are derived from recent room-type profiles, so long-horizon forecasting is intentionally simple.
- Revenue is based on non-cancelled `Reservation.totalPrice`, consistent with the current dashboard backend.
- Daily expenses are allocated proportionally by room inventory share because room-type-specific expense attribution is not stored in the Roomify schema.
- `train.py` still falls back to the local CSV when anonymous access to Spring training-data is blocked. Day 3 completed Spring-to-FastAPI inference integration, but the standalone trainer still uses the existing CSV fallback path.

## Why this is real AI
- A machine learning regression model is trained on historical hotel data.
- The model learns relationships between calendar features, room type, inventory, bookings, prices, expenses, revenue, and occupancy.
- The trained artifacts are saved and loaded by the FastAPI service for inference.
- React displays the model outputs only after Spring Boot retrieves and normalizes the AI service response.

## Demo clarification
The ML model predicts revenue and occupancy. Pricing recommendations use a bounded business policy based on model predictions, not a pure ML pricing model.

The pricing policy is bounded because room price changes should remain conservative, explainable, and manager-reviewed during the demo. The React dashboard presents recommendations as advisory only and does not apply price changes.
