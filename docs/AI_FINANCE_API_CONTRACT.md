# AI Finance API Contract

## Security
- All Spring Boot AI Finance endpoints are manager-only.
- Authentication uses the existing Roomify bearer token flow.

## Day 2 Spring Boot analytics endpoints

### GET `/api/ai-finance/data-summary`
Purpose:
- Return analytics readiness and overall dataset coverage.

Actual response shape:
```json
{
  "reservations": 1400,
  "payments": 1286,
  "expenses": 240,
  "dateRangeStart": "2024-12-28",
  "dateRangeEnd": "2026-04-30",
  "totalRevenue": 2292922.35,
  "averageOccupancy": 16.41104294478528,
  "roomTypes": 5
}
```

### GET `/api/ai-finance/summary`
Purpose:
- Return current week vs last week revenue, occupancy, top room type, expenses, and net profit.

Actual response shape:
```json
{
  "thisWeekRevenue": 28393.64,
  "lastWeekRevenue": 32775.64,
  "revenueChangePercentage": -13.3697,
  "currentOccupancy": 2.0833333333333335,
  "topRoomType": "Suite",
  "totalExpenses": 1200197.0,
  "netProfit": 1092725.35
}
```

Notes:
- Revenue uses non-cancelled `Reservation.totalPrice`, consistent with the existing dashboard foundation.
- The summary window is anchored to the latest operating date available in the dataset.

### GET `/api/ai-finance/revenue-trend?start=YYYY-MM-DD&end=YYYY-MM-DD`
Purpose:
- Return one revenue point per day with missing dates filled as `0.00`.

Actual response shape:
```json
[
  {
    "date": "2025-01-01",
    "revenue": 9669.28
  },
  {
    "date": "2025-01-02",
    "revenue": 2787.73
  }
]
```

### GET `/api/ai-finance/occupancy-trend?start=YYYY-MM-DD&end=YYYY-MM-DD`
Purpose:
- Return one occupancy point per day with occupied room nights, total room nights, and occupancy percent.

Actual response shape:
```json
[
  {
    "date": "2025-01-01",
    "occupancyRate": 8.333333333333334,
    "occupiedRoomNights": 4,
    "totalRoomNights": 48
  },
  {
    "date": "2025-01-02",
    "occupancyRate": 14.583333333333334,
    "occupiedRoomNights": 7,
    "totalRoomNights": 48
  }
]
```

### GET `/api/ai-finance/room-type-revenue`
Purpose:
- Return grouped room-type revenue, reservation count, and average reservation price.

Actual response shape:
```json
[
  {
    "roomType": "Deluxe",
    "revenue": 462213.75,
    "reservations": 310,
    "averagePrice": 1491.01
  },
  {
    "roomType": "Suite",
    "revenue": 551300.54,
    "reservations": 139,
    "averagePrice": 3966.19
  }
]
```

### GET `/api/ai-finance/training-data?start=YYYY-MM-DD&end=YYYY-MM-DD`
Purpose:
- Return one ML-ready row per date per room type.

Actual response shape:
```json
[
  {
    "date": "2025-01-01",
    "dayOfWeek": 3,
    "month": 1,
    "weekend": false,
    "roomType": "Standard",
    "roomTypeId": 1,
    "totalRooms": 18,
    "occupiedRoomNights": 1,
    "confirmedBookings": 1,
    "cancelledBookings": 0,
    "averageRoomPrice": 309.44,
    "dailyRevenue": 309.44,
    "dailyExpenses": 0.0,
    "occupancyRate": 5.555555555555555
  }
]
```

Validation rules enforced by the exported dataset:
- `dailyRevenue >= 0`
- `0 <= occupancyRate <= 100`
- `totalRooms > 0`
- `cancelledBookings >= 0`

### GET `/api/ai-finance/training-data.csv`
Purpose:
- Return the same training dataset in CSV form.

Actual CSV header:
```text
date,dayOfWeek,month,weekend,roomType,roomTypeId,totalRooms,occupiedRoomNights,confirmedBookings,cancelledBookings,averageRoomPrice,dailyRevenue,dailyExpenses,occupancyRate
```

Notes:
- Query parameters `start` and `end` are optional for CSV export.
- When omitted, the CSV uses the full detected dataset range.

## Day 2 FastAPI service endpoints

### GET `/health`
```json
{
  "status": "UP",
  "service": "ai-finance-service"
}
```

### GET `/model-info`
```json
{
  "modelType": "RandomForestRegressor",
  "trainedAt": "2026-04-29T14:03:22Z",
  "trainingRows": 2410,
  "revenueMae": 20.1108,
  "occupancyMae": 6.6309,
  "features": [
    "dayOfWeek",
    "month",
    "weekend",
    "roomType",
    "roomTypeId",
    "totalRooms",
    "occupiedRoomNights",
    "confirmedBookings",
    "cancelledBookings",
    "averageRoomPrice",
    "dailyExpenses",
    "occupancyRate"
  ],
  "targets": [
    "dailyRevenue",
    "occupancyRate"
  ],
  "trainingDateRange": {
    "start": "2025-01-01",
    "end": "2026-04-27"
  },
  "modelVersion": "ai-finance-v1",
  "trained": true
}
```

### POST `/forecast/full`
Purpose:
- Return a 30-day aggregated revenue and occupancy forecast.

Actual response shape:
```json
{
  "forecastStart": "2026-04-28",
  "forecastDays": 30,
  "predictedRevenueTotal": 190297.87,
  "predictedAverageOccupancy": 20.62,
  "confidence": 0.95,
  "points": [
    {
      "date": "2026-04-28",
      "predictedRevenue": 6390.21,
      "predictedOccupancy": 20.83
    }
  ]
}
```

### POST `/pricing/recommendations`
Purpose:
- Return bounded pricing recommendations by room type.

Actual response shape:
```json
[
  {
    "roomType": "Deluxe",
    "currentPrice": 443.37,
    "suggestedPrice": 399.03,
    "adjustmentPercent": -10.0,
    "riskLevel": "HIGH",
    "reason": "Predicted occupancy is weak, so a bounded discount is recommended to protect demand."
  }
]
```

Clarification:
- The ML model predicts revenue and occupancy.
- Pricing recommendations use a bounded business policy based on model predictions, not a pure ML pricing model.
