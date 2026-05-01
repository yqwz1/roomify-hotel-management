# AI Finance Runbook

## Feature Overview

AI Revenue Forecasting & Pricing Advisor is a Manager-only Roomify feature for reviewing revenue forecasts, occupancy demand, pricing recommendations, and AI-generated finance insights.

Current Day 2 frontend state:
- `/manager/ai-finance` is available only to Manager users.
- The React page uses static mock data and polished placeholders.
- No React-to-backend AI Finance API integration is enabled yet.
- Real AI/ML behavior is owned by backend and `ai-service` integration work, not by the Day 2 frontend skeleton.

## Current Architecture

Intended request path:

```text
React Manager AI Finance Dashboard
-> Spring Boot AiFinanceController
-> FinanceAnalyticsService
-> AiFinanceClient
-> Python FastAPI AI Service
-> scikit-learn ML Model
```

Current implementation notes:
- React route: `/manager/ai-finance`
- Frontend page: `frontend/src/pages/AiFinanceDashboard.jsx`
- Manager route guard: `frontend/src/App.jsx`
- Manager navigation entry: `frontend/src/components/navigation/navConfig.js`
- Spring Boot AI Finance API docs: `docs/AI_FINANCE_API_CONTRACT.md`
- Architecture details: `docs/AI_FINANCE_ARCHITECTURE.md`
- Python FastAPI service folder: `ai-service/`

Do not call FastAPI directly from React. Frontend integration should go through the Spring Boot API when later Person B integration tasks begin.

## How To Run Locally

### Normal startup, recommended

From the repository root:

```powershell
.\start-roomify-windows.ps1
```

This starts Docker/PostgreSQL/Mailpit, starts the Spring Boot backend, and now starts the AI Finance FastAPI service automatically when possible.

To skip the AI service and rely on Spring Boot fallback mode:

```powershell
.\start-roomify-windows.ps1 -SkipAiService
```

Expected behavior:
- FastAPI ON -> Spring AI Finance responses use `source=FASTAPI_MODEL`.
- FastAPI OFF or skipped -> Spring Boot fallback responses use `source=SAFE_DEMO_FALLBACK` when fallback is enabled.

FastAPI direct health checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/model-info
```

### 1. Start Docker services

Docker Compose provides PostgreSQL and Mailpit, plus an optional backend container.

```powershell
docker compose up -d postgres mailpit
```

Useful local ports:
- PostgreSQL container host port: `5433`
- Mailpit SMTP: `1025`
- Mailpit UI: `http://localhost:8025`

Warning: do not run `docker compose down -v` unless you intentionally want to delete the local PostgreSQL volume and all demo data.

### 2. Run the backend

From the repository root:

```powershell
$env:SPRING_PROFILES_ACTIVE='dev-demo'
$env:DB_HOST='localhost'
$env:DB_PORT='5433'
$env:DB_NAME='roomify'
$env:DB_USERNAME='roomify_user'
$env:DB_PASSWORD='roomify_pass'
$env:SPRING_FLYWAY_BASELINE_ON_MIGRATE='true'
$env:SPRING_FLYWAY_BASELINE_VERSION='12'
cd backend
mvn.cmd spring-boot:run
```

Expected backend URL:
- `http://localhost:8080`

Health check:

```powershell
Invoke-WebRequest http://localhost:8080/api/health
```

### 3. Run the frontend

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Expected frontend URL:
- Vite usually prints `http://localhost:5173`

Build check:

```powershell
cd frontend
npm run build
```

### 4. Run the AI service

The main Windows startup script now starts the AI service automatically:

```powershell
.\start-roomify-windows.ps1
```

Manual FastAPI startup remains available for troubleshooting:

```powershell
cd ai-service
pip install -r requirements.txt
python train.py
uvicorn main:app --reload --port 8000
```

Documented AI service endpoints:
- `GET /health`
- `GET /model-info`
- `POST /forecast/full`
- `POST /pricing/recommendations`

Day 2 frontend work does not connect React to this service. Spring Boot to FastAPI integration is documented as later integration work in the AI Finance docs.

## DB Strategy and Migration Status

Locked strategy based on current project files:
- Use the `dev-demo` profile for local/demo work.
- PostgreSQL is provided by Docker on host port `5433`.
- Flyway is enabled through `spring-boot-starter-flyway` and `flyway-database-postgresql`.
- Hibernate schema management is validation-only: `spring.jpa.hibernate.ddl-auto=validate`.
- The existing demo database uses Flyway baseline version `12`.
- `docker-compose.yml` sets `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true` and `SPRING_FLYWAY_BASELINE_VERSION=12` for the backend container.
- Existing SQL migration files live under `backend/src/main/resources/db/migration`.
- `V13__create_inventory_and_service_usage_tables.sql` creates the inventory and service usage tables.
- Runtime schema support code exists for legacy alignment and AI Finance indexes.

Current status:
- Backend health works on the existing demo database.
- AI Finance relies on existing hotel domain tables such as guests, room types, rooms, reservations, payments, and expenses.
- Fresh DB wipe verification has not been completed in this Day 2 frontend/docs task.
- `docker compose down -v` was intentionally not run because it deletes the local PostgreSQL volume and can destroy demo data.
- Fresh DB verification is postponed until a backup or separate disposable environment is available.

Resolved migration review items:
- Flyway is now enabled, so the migration directory is active for the current backend setup.
- Hibernate `ddl-auto` is locked to `validate`, so Hibernate is not being used to mutate schema during normal startup.
- The existing demo DB baseline is documented as version `12`.
- The old missing inventory/service usage schema gap is addressed by migration `V13`.
- Backend health on the existing demo DB is treated as the current Day 2 working path.

Legacy notes that are not active Day 2 blockers:
- `V4__create_staff_table.sql.sql` still has a double `.sql` suffix in the repository history.
- The existing migration set is being used with baseline version `12` for the demo DB, so older migration oddities should not be treated as active blockers unless a fresh disposable DB verification proves otherwise.

## Verify Current Day 2 State

### Backend health

```powershell
Invoke-WebRequest http://localhost:8080/api/health
```

Expected:
- HTTP `200 OK`

### Manager login

Use an existing Manager account for the local environment. A commonly used demo account in project docs is:
- Email: `admin@roomify.com`
- Password: `password123`

If login fails, confirm the active profile, database, seed state, and user roles in the local DB.

### Manager dashboard

Open:

```text
http://localhost:5173/manager/dashboard
```

Expected:
- Manager Dashboard loads for Manager users.
- Staff and Guest users should not be able to access the Manager Dashboard route.

### AI Finance dashboard

Open:

```text
http://localhost:5173/manager/ai-finance
```

Expected:
- Page renders a polished static Manager AI Finance preview.
- Sections appear in this order:
  1. Header
  2. AI Status
  3. Data Summary Cards
  4. Revenue Forecast
  5. Occupancy Forecast
  6. Pricing Recommendations
  7. AI Insights
- No live backend or FastAPI calls are made from React.

### Frontend build

```powershell
cd frontend
npm run build
```

Expected:
- Vite production build completes.

### Optional frontend tests

```powershell
cd frontend
npm test
```

Expected:
- Existing Vitest suite should pass, or failures should be recorded with file/test names.

## Common Problems And Fixes

### Missing table or schema validation errors

Symptoms:
- Backend startup fails during Hibernate validation.
- Errors mention missing tables, missing columns, enum/check constraints, or schema validation.

Fixes:
- Confirm PostgreSQL is running on the expected port.
- Confirm `SPRING_PROFILES_ACTIVE=dev-demo`.
- Confirm the backend is pointed at the intended DB using `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD`.
- Review `backend/src/main/resources/db/migration`.
- Review runtime alignment code before changing DB strategy.
- Do not wipe the Docker volume just to clear validation errors unless the team has backed up demo data or is using a disposable DB.

### esbuild spawn EPERM on Windows

Symptoms:
- `npm run dev`, `npm run build`, or `npm test` fails with an `esbuild` spawn `EPERM` error.

Fixes:
- Close running Vite/node processes.
- Run the terminal as a normal user with access to the repo path.
- Check antivirus or endpoint protection quarantine events for `node_modules\@esbuild`.
- Reinstall frontend dependencies if needed:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

Do not delete unrelated project data while troubleshooting frontend dependencies.

### Docker API blocked

Symptoms:
- `docker compose up` cannot connect to the Docker daemon.
- Docker commands fail with access denied or pipe/API errors.

Fixes:
- Start Docker Desktop.
- Confirm the current Windows user has Docker Desktop access.
- Restart Docker Desktop if the daemon is stuck.
- If corporate security software blocks Docker, use an approved local PostgreSQL instance and set backend DB environment variables explicitly.

### Browser or headless access denied

Symptoms:
- Playwright, browser automation, or headless checks fail with access denied.
- The app may still work in a manually opened browser.

Fixes:
- Verify the Vite dev server is running.
- Open the printed localhost URL manually.
- Check local security policy or browser profile restrictions.
- Use code inspection and `npm run build` when browser automation is blocked.

### Fresh DB warning

`docker compose down -v` deletes the local PostgreSQL volume. That removes local demo data, including any manually prepared Manager/demo records. Use it only in a disposable environment or after backup.

## Enable AI Finance Demo Seed Later

AI Finance demo data is controlled by Spring properties:
- `roomify.ai-finance.demo-seed-enabled`
- `roomify.ai-finance.demo-seed-reset`

Environment variable equivalents:
- `ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED`
- `ROOMIFY_AI_FINANCE_DEMO_SEED_RESET`

Enable without reset:

```powershell
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED='true'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET='false'
```

Enable with reset of AI Finance demo data:

```powershell
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED='true'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET='true'
```

Reset behavior is intended for AI Finance demo data only, but still verify the target database before using it.

Disable again:

```powershell
Remove-Item Env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED -ErrorAction SilentlyContinue
Remove-Item Env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET -ErrorAction SilentlyContinue
```

## AI Service Startup

Normal startup:

```powershell
.\start-roomify-windows.ps1
```

The script checks `http://127.0.0.1:8000/health`. If FastAPI is already running, it prints that the AI service is already running on port `8000` and does not start a duplicate process.

Skip AI service startup:

```powershell
.\start-roomify-windows.ps1 -SkipAiService
```

Expected skip behavior:
- Spring Boot still starts normally.
- AI Finance fallback remains available through Spring Boot when configured.
- Forecast, pricing, and Ask responses should show `source=SAFE_DEMO_FALLBACK` if FastAPI is unavailable and fallback is enabled.

Manual fallback troubleshooting command:

```powershell
cd ai-service
pip install -r requirements.txt
python train.py
uvicorn main:app --reload --port 8000
```

Use these URLs to check the FastAPI service once it is running:
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/model-info`

Do not wire React directly to FastAPI. Later integration should keep the frontend behind Spring Boot routes and Manager-only authorization.

## Manager-Only Access Note

AI Finance is intended for Manager users only.

Observed data coverage:
- Reservation check-in range: `2025-01-01` to `2026-04-27`
- Expense date range: `2025-01-04` to `2026-04-27`
- Reservation statuses in verified run: `CHECKED_OUT=1280`, `CHECKED_IN=6`, `CANCELLED=114`
- Overlap query result: `0`

## Day 3 Final Lock

Final status:
- Day 3 backend integration: COMPLETE
- Verification date: `2026-04-30`

How to start backend:
```powershell
$env:SPRING_PROFILES_ACTIVE='dev-demo'
$env:DB_HOST='localhost'
$env:DB_PORT='5432'
$env:DB_NAME='roomify_ai_finance_clean_test'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED='true'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET='false'
$env:ROOMIFY_AI_SERVICE_BASE_URL='http://localhost:8000'
$env:ROOMIFY_AI_SERVICE_TIMEOUT_MS='3000'
$env:ROOMIFY_AI_SERVICE_FALLBACK_ENABLED='true'
cd backend
mvn.cmd spring-boot:run
```

How to start FastAPI:
```powershell
cd ai-service
python train.py
python -m uvicorn main:app --port 8000
```

How to verify health:
```powershell
# Spring Boot health
Invoke-RestMethod -Uri 'http://localhost:8080/api/health'

# Manager login
$login = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"email":"admin@roomify.com","password":"password123"}'

$headers = @{ Authorization = "Bearer $($login.token)" }

# AI integration health through Spring
Invoke-RestMethod -Uri 'http://localhost:8080/api/ai-finance/health' -Headers $headers
```

How to test fallback:
1. Leave Spring Boot running.
2. Stop FastAPI only.
3. Call:
   - `GET /api/ai-finance/health`
   - `GET /api/ai-finance/revenue-forecast`
   - `GET /api/ai-finance/pricing-recommendations`
   - `POST /api/ai-finance/ask` with `{"intent":"REVENUE_FORECAST"}`
4. Confirm the response contains `source=SAFE_DEMO_FALLBACK` for forecast, pricing, and Ask.
5. Restart FastAPI and confirm `/api/ai-finance/health` returns `UP`.

How to test Ask endpoint:
```powershell
Invoke-RestMethod -Uri 'http://localhost:8080/api/ai-finance/ask' `
  -Method Post `
  -Headers $headers `
  -ContentType 'application/json' `
  -Body '{"intent":"REVENUE_FORECAST"}'
```

Verified final completion status:
- Backend compile: PASS
- `AiFinanceIntegrationTest`: PASS
- FastAPI ON through Spring: PASS
- FastAPI OFF fallback: PASS
- Manager-only security: PASS for manager and no-token checks
- Staff/Guest runtime auth checks: NOT AVAILABLE in the final Day 3 run because general demo bootstrap users were not enabled
