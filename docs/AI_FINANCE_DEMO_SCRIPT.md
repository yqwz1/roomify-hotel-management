# AI Finance Demo Script

## Pre-demo startup checklist

1. From the repository root, run:

   ```powershell
   .\start-roomify-windows.ps1
   ```

2. Confirm backend health:

   ```powershell
   Invoke-RestMethod http://127.0.0.1:8080/api/health
   ```

3. Confirm FastAPI health:

   ```powershell
   Invoke-RestMethod http://127.0.0.1:8000/health
   Invoke-RestMethod http://127.0.0.1:8000/model-info
   ```

4. Open `/manager/ai-finance` as a Manager.

If FastAPI is intentionally skipped with `.\start-roomify-windows.ps1 -SkipAiService`, explain that Spring Boot fallback mode remains available and AI Finance responses should be labeled `SAFE_DEMO_FALLBACK`.

## Supervisor review flow

1. Login as a Manager.
2. Open `/manager/ai-finance`.
3. Show the Data Summary cards and explain that they come from Spring Boot analytics endpoints.
4. Explain the generated historical data: realistic reservations, payments, expenses, room types, revenue, and occupancy were seeded for the graduation project demo.
5. Show the AI Status section and model metadata. Mention that React calls Spring Boot only; Spring Boot calls FastAPI.
6. Show Revenue Forecast. Explain that the top metrics and predicted chart are future model predictions.
7. Show Occupancy Forecast. Explain that the historical occupancy chart is context, while predicted occupancy is the AI forecast.
8. Show Pricing Recommendations. Explain they are advisory only and no price change is applied from the page.
9. Click the four AI Insight buttons:
   - Forecast next 30 days revenue.
   - Recommend prices for next week.
   - Analyze occupancy trend.
   - Show best performing room type.
10. Explain fallback behavior: if FastAPI is unavailable, Spring Boot returns deterministic `SAFE_DEMO_FALLBACK` responses and the UI shows a fallback banner.
11. Explain the architecture: React -> Spring Boot -> FastAPI -> trained ML model, with Spring Boot handling security and integration.

## Short narration

"This Manager-only dashboard combines Spring Boot finance analytics with a FastAPI machine learning service. The summary cards and historical charts come from Spring Boot data. The forecast, pricing recommendations, and insight buttons also go through Spring Boot, which securely integrates with FastAPI. If the AI service is unavailable, Spring returns a safe demo fallback so the supervisor demo remains clear without pretending the fallback is live model output."

## Goal
- Show that Roomify can start from the locked demo-safe backend profile
- Show seeded historical hotel data for analytics
- Show manager login and dashboard analytics foundation
- Transition cleanly into Day 2 / Day 3 forecasting endpoints when available

## Prep
```powershell
$env:SPRING_PROFILES_ACTIVE='dev-demo'
$env:DB_PORT='5432'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED='true'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET='true'
cd backend
mvn.cmd spring-boot:run
```

## Demo flow
1. Confirm `GET /api/health` returns `status=ok`.
2. Log in as manager demo user:
   - Email: `admin@roomify.com`
   - Password: `password123`
3. Show the dashboard metrics period `2026-01-01` to `2026-04-27`.
4. Explain that the seeded dataset contains 1400 reservations, 1286 linked payments, 240 expenses, 48 rooms, and 5 room types.
5. Show revenue and occupancy trend endpoints for April 2026.
6. Explain that the AI demo data is synthetic, realistic, and safe to reset independently.
7. When Day 2 / Day 3 endpoints are live, continue into forecast, pricing recommendation, and Ask AI Finance flows.

## Day 3 final demo flow
1. Log in as Manager with `admin@roomify.com / password123`.
2. Show `GET /api/dashboard/metrics` or the Manager Dashboard using the seeded dataset.
3. Show `GET /api/ai-finance/model-info` returning `RandomForestRegressor`, `trainingRows=2410`, `revenueMae=20.1108`, and `occupancyMae=6.6309`.
4. Show `GET /api/ai-finance/revenue-forecast` returning `forecastDays=30`, `predictedRevenueTotal=190297.87`, `predictedAverageOccupancy=20.62`, and `source=FASTAPI_MODEL`.
5. Show `GET /api/ai-finance/pricing-recommendations` returning room-type guidance through Spring Boot with `source=FASTAPI_MODEL`.
6. Use `POST /api/ai-finance/ask` with:
   - `REVENUE_FORECAST`
   - `PRICING_RECOMMENDATION`
   - `OCCUPANCY_ANALYSIS`
   - `ROOM_TYPE_PERFORMANCE`
7. Stop FastAPI only and refresh:
   - `GET /api/ai-finance/health` -> `status=DOWN`
   - `GET /api/ai-finance/revenue-forecast` -> `source=SAFE_DEMO_FALLBACK`
   - `GET /api/ai-finance/pricing-recommendations` -> `source=SAFE_DEMO_FALLBACK`
   - `POST /api/ai-finance/ask` `REVENUE_FORECAST` -> `source=SAFE_DEMO_FALLBACK`
8. Restart FastAPI and confirm `GET /api/ai-finance/health` returns `status=UP` again.

## Reset-safe closeout
```powershell
Remove-Item Env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED -ErrorAction SilentlyContinue
Remove-Item Env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET -ErrorAction SilentlyContinue
```
