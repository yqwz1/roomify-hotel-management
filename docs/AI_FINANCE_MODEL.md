# AI Finance Model

## Objective
- Forecast short-horizon revenue and occupancy
- Recommend room-type pricing adjustments for managers

## Planned model shape
- Lightweight supervised regression pipeline
- Daily and room-type-level features derived from seeded historical data
- Separate forecast outputs for revenue and occupancy
- Pricing recommendation layer derived from forecast demand and room-type sensitivity

## Training data foundation prepared on Day 1
- Historical reservations with realistic seasonality and weekend effects
- Room-type mix with uneven inventory distribution
- Payment completion states for revenue collection context
- Expense history for finance summary and profitability features
- Explicit overlap prevention so occupancy labels remain consistent

## Candidate feature set
- Date
- Day of week
- Weekend flag
- Month and season
- Room type
- Daily reservation count
- Occupied room count
- Occupancy rate
- Revenue
- Average daily rate
- Cancellation count
- Expense allocation

## Model artifacts to persist by Day 2 / Day 3
- Serialized trained model file
- Feature schema or column order metadata
- Training timestamp
- Training date range
- Validation metrics
- Model version string

## Backend integration expectations
- Spring Boot sends aggregated training or inference payloads to the FastAPI service
- `roomify.ai-service.timeout-ms` bounds remote inference latency
- `roomify.ai-service.fallback-enabled=true` allows a safe deterministic demo response when the ML service is unavailable
