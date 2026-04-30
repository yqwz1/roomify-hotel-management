# AI Finance Runbook

## DB Migration Review

### Existing migration files
- `V1__create_users_table.sql`
- `V2__create_audit_logs_table.sql`
- `V3__add_security_fields_to_users.sql`
- `V4__create_staff_table.sql.sql`
- `V5__add_staff_search_indexes.sql`
- `V6__seed_test_reservations.sql`
- `V7__add_reservation_lifecycle_fields.sql`
- `V8__add_checkout_financial_fields.sql`
- `V9__add_payment_status_to_reservations.sql`
- `V10__create_expenses_table.sql`
- `V11__create_user_roles_table.sql`
- `V12__seed_staff_user.sql`

### Problems found
- No Flyway dependency is present in `backend/pom.xml`, so `backend/src/main/resources/db/migration` is not an active full-schema migration system today.
- The default profile uses `spring.jpa.hibernate.ddl-auto=validate`, so a clean database cannot start because schema validation runs before `ReservationSchemaAlignment`.
- Core AI Finance tables are not fully covered by active migrations: `guests`, `room_types`, `rooms`, `reservations`, and `payments` depend on JPA schema generation or legacy runtime repair rather than complete versioned SQL.
- `V4__create_staff_table.sql.sql` has a double `.sql` suffix and is a signal that the migration set has drifted.
- `V6__seed_test_reservations.sql` targets an old guest shape (`first_name`, `last_name`, `created_at`) that does not match the current `Guest` entity (`name`, `email`, `phone`, `id_number`, `nationality`).
- `V1__create_users_table.sql` seeds `admin@roomify.com` with a placeholder password hash, so the SQL seed is not enough for a reliable manager demo login.
- `V11__create_user_roles_table.sql` adds `MANAGER` for `admin@roomify.com`, but that still depends on the incomplete baseline user seed.
- `docker-compose.yml` originally enabled demo bootstrap by default, which was not demo-safe.
- Existing PostgreSQL check constraints on `payments` and `expenses` did not allow the widened AI Finance enums until runtime alignment was extended.
- The local host PostgreSQL service listens on `5432`, while Docker host mapping uses `5433`; that required an explicit profile lock to avoid ambiguous startup behavior.

### Required AI Finance tables
- guests
- room_types
- rooms
- reservations
- payments
- expenses

### Required relationships
- room_types -> rooms
- guests -> reservations
- rooms -> reservations
- reservations -> payments
- expenses independent or linked depending on existing project schema

## Locked DB Strategy

Chosen strategy:
Option B: use a `dev-demo` profile with reliable schema creation and controlled seed data.

Reason:
The repository does not currently ship a complete active Flyway baseline for all required hotel tables, while the default profile validates schema before runtime repair code can help. A dedicated `dev-demo` profile with `spring.jpa.hibernate.ddl-auto=update` gives a safe, non-destructive startup path for a fresh or stable demo database, while keeping demo bootstrap and AI seed execution opt-in.

Rule:
Do not switch strategy mid-feature unless blocked.

Profile:
- `dev-demo`

Key files:
- `backend/src/main/resources/application-dev-demo.properties`
- `docker-compose.yml`
- `backend/src/main/java/com/roomify/backend/config/ReservationSchemaAlignment.java`
- `backend/src/main/java/com/roomify/backend/config/AiFinanceIndexInitializer.java`

Guaranteed path:
- fresh DB or stable demo DB -> backend starts -> manager login works

## Day 1 DB Smoke Test

Date:
- 2026-04-28

DB strategy used:
- `dev-demo` profile against local PostgreSQL 16 on `localhost:5432`, database `roomify`

Backend startup result:
- PASS after widening legacy enum constraints for `payments` and `expenses`

Manager login result:
- PASS
- Verified via `POST /api/auth/login` with `admin@roomify.com` / `password123`

Dashboard result:
- PASS at backend API level
- Verified with `GET /api/dashboard/metrics?startDate=2026-01-01&endDate=2026-04-27` returning `200 OK`
- Frontend Manager Dashboard UI was not launched in this backend-only smoke session

Errors found:
- Startup initially failed on legacy constraint `payments_payment_method_check`
- Second startup initially failed on legacy constraint `expenses_payment_method_check`

Fixes applied:
- Added AI Finance config defaults
- Locked `dev-demo` profile with `ddl-auto=update`
- Disabled accidental demo bootstrap by default in `docker-compose.yml`
- Added runtime index initializer
- Extended `ReservationSchemaAlignment` to rebuild payment and expense enum constraints against current enums

Final status:
- PASS

## AI Finance Demo Seeder

Seeder class:
- `backend/src/main/java/com/roomify/backend/config/AiFinanceDemoDataSeeder.java`

How to enable seeding:
```powershell
$env:SPRING_PROFILES_ACTIVE='dev-demo'
$env:DB_PORT='5432'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED='true'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET='false'
cd backend
mvn.cmd spring-boot:run
```

How to reset AI demo data:
```powershell
$env:SPRING_PROFILES_ACTIVE='dev-demo'
$env:DB_PORT='5432'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED='true'
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET='true'
cd backend
mvn.cmd spring-boot:run
```

Expected reservation count:
- 1,400 AI demo reservations

Expected payment count:
- 1,286 AI demo payments in the verified seed run

Expected expense count:
- 240 AI demo expenses

Room inventory produced:
- 5 room types
- 48 AI demo rooms

How to verify data:
```sql
SELECT COUNT(*) FROM reservations WHERE confirmation_number LIKE 'AI-DEMO-RES-%';
SELECT COUNT(*) FROM payments WHERE gateway_reference LIKE 'AI-DEMO-PAY-%';
SELECT COUNT(*) FROM expenses WHERE receipt_file_name LIKE 'AI-DEMO-EXP-%';
SELECT COUNT(*) FROM rooms WHERE room_number LIKE 'AI-%';
SELECT COUNT(*) FROM room_types WHERE name IN ('Standard','Deluxe','Suite','Family','Executive');
```

How to check overbooking:
```sql
SELECT COUNT(*)
FROM reservations r1
JOIN reservations r2
  ON r1.room_id = r2.room_id
 AND r1.id < r2.id
 AND r1.confirmation_number LIKE 'AI-DEMO-RES-%'
 AND r2.confirmation_number LIKE 'AI-DEMO-RES-%'
 AND r1.status <> 'CANCELLED'
 AND r2.status <> 'CANCELLED'
 AND r1.check_in_date < r2.check_out_date
 AND r1.check_out_date > r2.check_in_date;
```

How to disable seeding again:
```powershell
Remove-Item Env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED -ErrorAction SilentlyContinue
Remove-Item Env:ROOMIFY_AI_FINANCE_DEMO_SEED_RESET -ErrorAction SilentlyContinue
```

Idempotency behavior:
- If `roomify.ai-finance.demo-seed-enabled=false`, the seeder does not run.
- If `roomify.ai-finance.demo-seed-enabled=true` and `roomify.ai-finance.demo-seed-reset=false`, existing AI Finance demo data is detected and generation is skipped.
- If `roomify.ai-finance.demo-seed-reset=true`, only AI Finance data is deleted and regenerated.
- Non-AI project data is not deleted.

Idempotency verification:
- Verified on 2026-04-28 by restarting the backend with `ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED=true` and `ROOMIFY_AI_FINANCE_DEMO_SEED_RESET=false`
- Counts remained unchanged: `1400` reservations, `1286` payments, `240` expenses

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
