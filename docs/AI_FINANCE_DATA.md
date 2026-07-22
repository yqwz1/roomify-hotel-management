# AI Finance Data

Since this is a graduation project and the system is not connected to a real hotel production database, we generated realistic historical hotel data to train and demonstrate the forecasting model.

## Date range
- Reservations use check-in dates from `2025-01-01` to `2026-04-27`
- Expenses span `2025-01-04` to `2026-04-27`

## Room types
- Standard
- Deluxe
- Family
- Executive
- Suite

## Verified Day 1 seed counts
- Room types: 5
- Rooms: 48
- Reservations: 1400
- Non-cancelled reservations: 1286
- Payments: 1286
- Expenses: 240

## Payment generation
- One payment record is created for each non-cancelled seeded reservation
- Distribution target:
  - `CARD` (credit card behavior in current schema): 55%
  - `ONLINE`: 20%
  - `CASH`: 15%
  - `BANK_TRANSFER`: 10%
- Payment status target:
  - `PAID`: 85%
  - `PARTIALLY_PAID`: 15%

## Expense generation
- Categories used:
  - `CLEANING_SUPPLIES`
  - `MAINTENANCE`
  - `UTILITIES`
  - `SALARIES`
  - `CONSUMABLES`
  - `MARKETING`
- Salaries and utilities recur every month
- Cleaning allocations are weighted toward higher occupancy dates
- Maintenance and marketing are less frequent and more variable

## Demand patterns
- Higher Thursday-Friday-Saturday demand
- Higher peak-season pricing in January, February, July, August, and December
- Softer demand in June and September
- Random day-level variation is applied to avoid flat trend lines
- Higher-tier room types carry stronger pricing multipliers

## Cancellation rate
- Verified seeded cancellation count: 114 out of 1400 reservations
- Effective cancellation rate: 8.14%

## Overbooking prevention
- A reservation is only inserted for a room when no active overlap exists
- Active occupancy logic ignores `CANCELLED` reservations
- Overlap rule:
  - `existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn`
- Verified SQL overlap check result: `0`

## Limitations
- The dataset is synthetic and optimized for demo realism, not real-world financial auditing
- Room numbers use an `AI-` prefix so the seeder can reset only AI data safely
- Existing Roomify pricing logic is simpler than the seeded historical pricing curve, so seeded totals intentionally represent historical market variation rather than only base-rate calculations

## Training data access
- JSON endpoint: `GET /api/ai-finance/training-data?start=2025-01-01&end=2026-04-27`
- CSV export: `GET /api/ai-finance/training-data.csv`
- The training dataset is daily, room-type-level aggregate data.
- The current `ai-finance-v2` training run used `4386` cached synthetic rows covering `2024-05-21` through `2026-05-21`.
- React does not need the raw training data for the dashboard demo; it consumes summary, trend, forecast, pricing, and Ask endpoints through Spring Boot.

## Data limitations for supervisor explanation
- The data is realistic synthetic hotel data, not production hotel data.
- The dataset is suitable for demonstrating forecasting, fallback behavior, and UI integration.
- The data should not be presented as audited financial history.
