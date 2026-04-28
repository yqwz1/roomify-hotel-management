# AI Finance API Contract

## Security
- All AI Finance endpoints are manager-only.
- Authentication uses the existing Roomify bearer token flow.

## Existing analytics foundation already available
- `GET /api/dashboard/metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `GET /api/dashboard/trends/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `GET /api/dashboard/trends/occupancy?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `GET /api/dashboard/room-type-distribution`

## AI Finance backend contract

### GET `/api/ai-finance/data-summary`
Purpose:
- Return seeded data coverage and readiness for analytics and ML training.

Response shape:
```json
{
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2026-04-27"
  },
  "roomTypeCount": 5,
  "roomCount": 48,
  "reservationCount": 1400,
  "nonCancelledReservationCount": 1286,
  "paymentCount": 1286,
  "expenseCount": 240,
  "overlapCheckPassed": true
}
```

### GET `/api/ai-finance/finance-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Purpose:
- Return revenue, expenses, profit, occupancy, and payment collection totals for a selected period.

### GET `/api/ai-finance/trends/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Purpose:
- Return daily or weekly revenue trend points for the forecasting feature.

### GET `/api/ai-finance/trends/occupancy?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Purpose:
- Return occupancy series for the same period and aggregation window used by the model.

### GET `/api/ai-finance/room-type-revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Purpose:
- Return grouped revenue, reservation count, ADR, and occupancy by room type.

### GET `/api/ai-finance/training-data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Purpose:
- Export ML-ready rows for the FastAPI service.

Response shape:
```json
{
  "generatedAt": "2026-04-28T23:00:00Z",
  "rows": [
    {
      "date": "2026-04-01",
      "roomType": "Standard",
      "reservations": 8,
      "occupiedRooms": 6,
      "occupancyRate": 0.67,
      "revenue": 4120.55,
      "avgDailyRate": 686.76,
      "expenseAllocation": 520.30,
      "isWeekend": false,
      "season": "SPRING"
    }
  ]
}
```

### POST `/api/ai-finance/forecast`
Purpose:
- Request revenue and occupancy forecasts from the FastAPI service.

Request shape:
```json
{
  "horizonDays": 30,
  "roomTypes": ["Standard", "Deluxe", "Suite"]
}
```

Response shape:
```json
{
  "modelVersion": "ai-finance-v1",
  "generatedAt": "2026-04-28T23:00:00Z",
  "points": [
    {
      "date": "2026-05-01",
      "roomType": "Standard",
      "forecastRevenue": 15230.40,
      "forecastOccupancyRate": 0.74,
      "recommendedPrice": 248.00,
      "confidence": 0.82
    }
  ],
  "fallback": false
}
```

### POST `/api/ai-finance/ask`
Purpose:
- Return a manager-readable explanation layer over the forecast and pricing recommendation payloads.

Fallback contract:
- When the FastAPI service times out or is unavailable and `roomify.ai-service.fallback-enabled=true`, the backend returns a safe fallback response with `fallback=true`, preserved HTTP `200`, and an explicit `message` field describing that a deterministic demo response was used.
