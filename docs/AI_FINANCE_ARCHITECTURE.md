# AI Finance Architecture

## Components
- PostgreSQL stores hotel operational and financial history
- Spring Boot owns data aggregation, security, contracts, and fallback behavior
- FastAPI serves training and inference for the lightweight forecasting model
- Frontend manager pages consume Spring Boot AI Finance endpoints

## Day 1 foundation delivered
- Locked `dev-demo` database startup profile
- Safe AI Finance configuration keys
- Runtime index creation for analytics-heavy columns
- Standalone AI Finance demo data seeder
- Historical reservation, payment, and expense generation with overlap prevention
- Runbook documentation and smoke-test verification

## Data flow
1. PostgreSQL stores reservations, payments, expenses, rooms, room types, and guests.
2. Spring Boot validates access, aggregates analytics, and exposes manager-only endpoints.
3. Spring Boot training-data endpoints prepare ML-ready rows from the historical dataset.
4. FastAPI trains and serves forecast outputs.
5. Spring Boot applies timeout and fallback rules before responding to the frontend.

## Safety rules
- AI demo seeding is disabled by default
- AI demo reset is disabled by default
- Existing `DemoDataBootstrap` stays separate from the AI Finance seeder
- Reset deletes only AI-prefixed records
- The locked DB strategy is profile-based and non-destructive (`ddl-auto=update`)

## Key backend files
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev-demo.properties`
- `backend/src/main/java/com/roomify/backend/config/ReservationSchemaAlignment.java`
- `backend/src/main/java/com/roomify/backend/config/AiFinanceIndexInitializer.java`
- `backend/src/main/java/com/roomify/backend/config/AiFinanceDemoDataSeeder.java`

## AI service integration contract
- Base URL comes from `roomify.ai-service.base-url`
- Timeout comes from `roomify.ai-service.timeout-ms`
- Fallback behavior is controlled by `roomify.ai-service.fallback-enabled`
