# AI Finance Demo Script

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
