# Roomify Hotel Management

Roomify is a monorepo with:

- `frontend/`: Vite + React, deployed to Vercel
- `backend/`: Spring Boot, deployed to Render
- `ai-service/`: FastAPI, deployed to Render
- Database: Supabase Postgres

This branch is prepared for a free-production-style split deployment with environment-driven URLs, production CORS, Render blueprints, Dockerfiles, and example env files.

## Repository Setup

- Frontend deploy root: `frontend/`
- Backend deploy root: `backend/`
- AI service deploy root: `ai-service/`
- Render blueprint: `render.yaml`

## Environment Files

- Frontend example: `frontend/.env.example`
- Backend example: `backend/.env.example`
- AI service example: `ai-service/.env.example`

## Deployment Targets

### 1. Supabase

Create a Supabase Postgres project, then collect:

- Host
- Port
- Database name
- Username
- Password
- Direct JDBC URL with SSL enabled

Recommended backend env:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://db.your-supabase-project.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-password
```

Render free services sleep when idle. Supabase pooling is recommended if you want to limit connection pressure, but keep a direct Postgres URL available for Flyway if needed.

### 2. AI Service on Render

You can deploy either from the included `render.yaml` or manually as a Docker web service.

Build and start behavior:

- Docker build context: `ai-service/`
- Container command: `uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`
- Health endpoint: `/health`

Important env:

```env
ROOMIFY_BACKEND_URL=https://your-backend.onrender.com
AI_SERVICE_CORS_ALLOWED_ORIGINS=
```

### 3. Backend on Render

Deploy as a Docker web service from `backend/`.

Build and start behavior:

- Docker build context: `backend/`
- Maven package runs inside the Docker build
- Container start command: `java -Dspring.profiles.active=prod -jar /app/app.jar`
- Health endpoint: `/api/health`
- Plain local package command: `mvn package`

Required backend env:

```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://db.your-supabase-project.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-password
ROOMIFY_FRONTEND_URL=https://your-frontend.vercel.app
ROOMIFY_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-frontend.vercel.app,https://*.vercel.app
ROOMIFY_AI_SERVICE_BASE_URL=https://your-ai-service.onrender.com
ROOMIFY_JWT_SECRET=replace-with-a-long-random-secret
```

Optional but usually needed in production:

```env
SPRING_MAIL_HOST=smtp.example.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=...
SPRING_MAIL_PASSWORD=...
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_STARTTLS_ENABLE=true
OPENAI_API_KEY=...
ROOMIFY_MAIL_FROM=noreply@your-domain.com
ROOMIFY_MAIL_RESET_BASE_URL=https://your-frontend.vercel.app/reset-password
```

### 4. Frontend on Vercel

Create a Vercel project with:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Set these frontend env vars:

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_API_WS_URL=https://your-backend.onrender.com
VITE_ROOMIFY_DEMO_BOOTSTRAP_ENABLED=false
```

The SPA fallback is already configured in `frontend/vercel.json`.

## Render Blueprint

The included `render.yaml` defines:

- `roomify-backend` as a free Docker web service
- `roomify-ai-service` as a free Docker web service
- a private Render-to-Render AI service URL wiring via `fromService`

You still need to provide secret values such as:

- `SPRING_DATASOURCE_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `ROOMIFY_JWT_SECRET`
- SMTP credentials
- `OPENAI_API_KEY`
- `ROOMIFY_FRONTEND_URL`

## Production Config Changes Already Applied

- Frontend API and websocket URLs are now env-driven.
- Frontend no longer falls back to `http://localhost:8080/api` in production code.
- Vite dev proxy is configurable with `VITE_DEV_PROXY_TARGET`.
- Spring CORS is centralized and supports configurable origin patterns, including Vercel previews.
- SockJS/websocket origins now use the same backend CORS source.
- Spring has a dedicated `prod` profile.
- Backend uses `PORT` when provided by the platform.
- Backend AI service integration no longer falls back to `localhost` when unset.
- AI training now reads backend/login URLs from env instead of hardcoded local URLs.
- Dockerfiles are in place for both backend and AI service.
- Backend packaging skips the stale legacy test tree by default via Maven so deployment builds stay green.

## Local Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

AI service:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If you want frontend API proxying in local development, set:

```env
VITE_DEV_PROXY_TARGET=http://localhost:8080
```
