<p align="center">
  <img src="frontend/public/roomify-logo.png" alt="Roomify Logo" width="80" />
</p>

<h1 align="center">Roomify Hotel Management System</h1>

<p align="center">
  A full-stack hotel operations platform with AI-powered analytics, real-time guest assistance, and ZATCA-compliant invoicing.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-4.0-green?logo=springboot" alt="Spring Boot 4.0" />
  <img src="https://img.shields.io/badge/React-18.2-blue?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Python-3.x-yellow?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [AI Service](#ai-service)
- [Authentication & Authorization](#authentication--authorization)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Demo Mode](#demo-mode)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Roomify is a production-grade hotel management system built for mid-size hospitality operations. It covers the full lifecycle of hotel management: reservations, check-in/check-out, billing, guest services, staff coordination, inventory tracking, and financial analytics, all from a single unified platform.

The system is split into three independently deployable services:

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Backend** | Spring Boot 4.0 (Java 21) | `8080` | REST API, business logic, WebSocket |
| **Frontend** | React 18 + Vite | `3000` | Single-page application |
| **AI Service** | FastAPI (Python) | `8000` | Revenue forecasting & dynamic pricing |

---

## Features

### Reservation Management
- Full lifecycle: create, confirm, check-in, check-out, cancel, modify
- Automatic confirmation number generation
- Room availability & overlap conflict detection
- Price recalculation on modification (room rate + configurable VAT)
- Email notifications on every status change (with retry logic)
- Complete audit trail for all reservation events

### Guest Experience
- Self-service room search and booking
- Real-time AI guest assistant (floating chat widget via WebSocket/STOMP)
- Service request submission and tracking
- Billing status view with PDF invoice download
- Multi-language support (Arabic & English)

### Staff & Manager Operations
- **Manager Dashboard** - KPIs: revenue, occupancy rate, expense breakdown
- **Staff Dashboard** - Check-in queue, service requests, inventory alerts
- Reservation lookup by confirmation number or guest name
- Guest inbox for staff-to-guest messaging through the assistant
- Expense tracking by category
- System-wide audit log viewer

### Financial Analytics (AI-Powered)
- Revenue and occupancy trend visualization
- ML-based revenue and occupancy forecasting
- Price elasticity modeling
- Dynamic pricing recommendations
- Expense categorization and tracking

### Invoicing & Compliance
- PDF invoice generation with automatic ZATCA QR codes (Saudi Arabia tax compliance)
- Configurable VAT rate (default: 15%)
- Invoice delivery tracking and logging
- Seller VAT registration number on invoices

### Notifications & Communication
- Transactional email on reservation events (create, cancel, modify)
- Retry mechanism: up to 5 attempts with exponential backoff (5-180 min)
- Rate limiting: 12/hour, 40/day per recipient
- All delivery attempts logged with status (SENT/FAILED)
- Real-time WebSocket notifications for guest assistant

---

## Architecture

```
                    +-------------------+
                    |    React SPA      |
                    |   (Port 3000)     |
                    +--------+----------+
                             |
                    REST / WebSocket (STOMP)
                             |
                    +--------v----------+
                    |   Spring Boot     |
                    |   (Port 8080)     |
                    +----+--------+-----+
                         |        |
              +----------+        +----------+
              |                              |
    +---------v---------+         +----------v---------+
    |   PostgreSQL 16   |         |   AI Service       |
    |   (Port 5433)     |         |   FastAPI           |
    +-------------------+         |   (Port 8000)       |
                                  +--------------------+
              +-------------------+
              |    Mailpit        |
              |  SMTP (1025)      |
              |  Web UI (8025)    |
              +-------------------+
```

- **Frontend** communicates with the backend via Vite dev-server proxy (`/api` -> `localhost:8080`)
- **Backend** manages all business logic, persistence, authentication, and email delivery
- **AI Service** provides ML-powered forecasting and pricing, called by the backend
- **PostgreSQL** stores all application data with Flyway-managed migrations
- **Mailpit** captures emails in development (SMTP sink with web UI)

---

## Tech Stack

### Backend
| Category | Technology |
|----------|-----------|
| Framework | Spring Boot 4.0.1, Spring Security, Spring Data JPA |
| Language | Java 21 |
| Database | PostgreSQL 16, Hibernate ORM |
| Migrations | Flyway |
| Authentication | JWT (JJWT 0.11.5) |
| Email | Spring Mail (Mailpit in dev) |
| WebSocket | Spring WebSocket + STOMP |
| PDF Generation | iTextPDF 7.2.5 |
| QR Codes | ZXing 3.5.2 |
| Build | Maven |

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | React 18.2.0 |
| Build Tool | Vite 7.3.1 |
| Routing | React Router DOM 7.12.0 |
| UI Components | Radix UI + shadcn/ui |
| Styling | Tailwind CSS 3.4.19 |
| Charts | Recharts 3.8.1 |
| Animations | Framer Motion 12.38.0 |
| Forms & Validation | Zod 4.3.6 |
| i18n | i18next 25.8.17 |
| HTTP Client | Axios 1.13.2 |
| WebSocket | STOMP.js + SockJS 1.6.1 |
| Icons | Lucide React |
| Testing | Vitest 4.0.18, React Testing Library |

### AI Service
| Category | Technology |
|----------|-----------|
| Framework | FastAPI + Uvicorn |
| ML | scikit-learn (RandomForestRegressor) |
| Serialization | joblib |

---

## Project Structure

```
roomify-hotel-management/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/
│       │   ├── java/com/roomify/backend/
│       │   │   ├── controller/        # 20+ REST controllers
│       │   │   ├── service/           # 30+ business services
│       │   │   ├── entity/            # JPA entities
│       │   │   ├── dto/               # Request/response DTOs
│       │   │   ├── repository/        # Spring Data repositories
│       │   │   ├── config/            # Security, JWT, CORS, demo bootstrap
│       │   │   ├── security/          # Role evaluator, custom annotations
│       │   │   ├── assistant/         # Guest assistant logic
│       │   │   ├── exception/         # Global error handling
│       │   │   └── notification/      # Email retry & delivery logging
│       │   └── resources/
│       │       ├── application.properties
│       │       └── db/migration/      # 25 Flyway SQL migrations
│       └── test/                      # JUnit 5 + Mockito tests
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   └── src/
│       ├── pages/                     # 70+ page components
│       ├── components/                # 170+ UI components
│       │   ├── ai-assistant/          # Chatbot UI
│       │   ├── ai-finance/            # Analytics dashboard widgets
│       │   ├── charts/                # Data visualizations
│       │   ├── common/                # Header, Footer, Sidebar
│       │   ├── dashboard/             # Manager & Staff dashboards
│       │   ├── guest-assistant/       # Floating chat widget
│       │   ├── inventory/             # Stock management UI
│       │   ├── marketing/             # Landing page components
│       │   └── motion/                # Animation wrappers
│       ├── services/                  # 24 API client modules
│       ├── context/                   # AuthProvider (React Context)
│       ├── hooks/                     # Custom React hooks
│       ├── utils/                     # Helpers
│       └── i18n.js                    # Arabic/English translations
│
├── ai-service/
│   ├── main.py                        # FastAPI application
│   ├── model.py                       # ML model definitions
│   ├── elasticity_model.py            # Price elasticity modeling
│   ├── train.py                       # Model training script
│   ├── requirements.txt
│   ├── models/                        # Serialized trained models
│   └── data/                          # Training data cache
│
├── docs/                              # Architecture, API contracts, runbooks
├── .github/workflows/                 # CI pipelines
├── docker-compose.yml                 # PostgreSQL + Mailpit
├── start-roomify-windows.ps1          # Windows startup script
├── start-roomify-mac.sh               # macOS/Linux startup script
└── RUNNING.md                         # Startup & troubleshooting guide
```

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| **Docker Desktop** | Latest (must be running) |
| **Java JDK** | 21+ |
| **Node.js** | 22+ |
| **npm** | 10+ |
| **Python** | 3.10+ (only for AI service) |
| **Maven** | 3.9+ (or use the Maven wrapper) |

---

## Getting Started

### Quick Start (Recommended)

The platform startup scripts handle Docker containers, database initialization, and backend launch in one command.

**Windows (PowerShell):**
```powershell
.\start-roomify-windows.ps1
```

**macOS / Linux:**
```bash
./start-roomify-mac.sh
```

The script will:
1. Start PostgreSQL (port 5433) and Mailpit (SMTP 1025, Web UI 8025) via Docker Compose
2. Wait for infrastructure readiness
3. Free port 8080 if occupied
4. Launch the backend with demo bootstrap enabled
5. Wait for the health endpoint to respond
6. Print a ready checklist

**Then start the frontend manually in a separate terminal:**
```bash
cd frontend
npm install
npm run dev
```

**Open the app:** [http://localhost:3000](http://localhost:3000)

### Manual Setup

If you prefer to start each component individually:

**1. Start infrastructure:**
```bash
docker compose up -d postgres mailpit
```

**2. Start the backend:**
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments="--DB_PORT=5433"
```

**3. Start the frontend:**
```bash
cd frontend
npm install
npm run dev
```

**4. (Optional) Start the AI service:**
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Stopping Everything

| Component | Command |
|-----------|---------|
| Frontend | `Ctrl+C` in its terminal |
| Backend (Windows) | `Stop-Process -Id (Get-Content .\backend\demo-backend.pid)` |
| Backend (macOS) | `kill "$(cat backend/demo-backend.pid)"` |
| Infrastructure | `docker compose stop postgres mailpit` |

---

## Environment Variables

### Backend (`backend/src/main/resources/application.properties`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8080` | Backend server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port (5433 for local dev) |
| `DB_NAME` | `roomify` | Database name |
| `DB_USERNAME` | `roomify` | Database user |
| `DB_PASSWORD` | `roomify` | Database password |
| `SPRING_MAIL_HOST` | `127.0.0.1` | SMTP server host |
| `SPRING_MAIL_PORT` | `1025` | SMTP server port |
| `ROOMIFY_JWT_SECRET` | (built-in) | JWT signing secret |
| `ROOMIFY_DEMO_BOOTSTRAP_ENABLED` | `false` | Enable demo data seeding on startup |
| `ROOMIFY_DEMO_ADMIN_PASSWORD` | - | Password for seeded admin account |
| `ROOMIFY_VAT_RATE` | `0.15` | VAT rate for invoicing (KSA default) |
| `ROOMIFY_INVOICE_SELLER_NAME` | - | Seller name on invoices |
| `ROOMIFY_INVOICE_SELLER_VAT_NUMBER` | - | Seller VAT registration number |
| `ROOMIFY_AI_SERVICE_BASE_URL` | `http://localhost:8000` | AI service URL |
| `OPENAI_API_KEY` | - | OpenAI key for guest assistant (optional) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ROOMIFY_DEMO_BOOTSTRAP_ENABLED` | `true` | Enable demo quick-login shortcuts |
| `VITE_ROOMIFY_DEMO_ADMIN_PASSWORD` | - | Demo admin password for quick login |

Copy `frontend/.env.example` to `frontend/.env` and adjust as needed.

---

## API Reference

**Base path:** `/api`

### Core Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/auth/login` | Public | Authenticate and receive JWT |
| `POST` | `/api/auth/signup` | Public | Register a new guest account |
| `GET` | `/api/health` | Public | Liveness probe |

### Reservations

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/reservations` | Manager, Staff | Create reservation |
| `GET` | `/api/reservations/search` | Manager, Staff | Search by confirmation or guest name |
| `GET` | `/api/reservations/{confirmationNumber}` | Manager, Staff | Get reservation details |
| `POST` | `/api/reservations/check-in/{confirmationNumber}` | Manager, Staff | Check in a guest |
| `POST` | `/api/reservations/{id}/cancel` | Manager, Staff | Cancel reservation |
| `PUT` | `/api/reservations/{id}` | Manager, Staff | Modify reservation |

### Rooms & Search

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/rooms` | Authenticated | List all rooms |
| `GET` | `/api/room-search/available` | Authenticated | Search available rooms by date range |

### Guest Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/guest/reservations` | Guest | View own reservations |
| `GET` | `/api/guest/billing` | Guest | View billing status |
| `POST` | `/api/guest/service-requests` | Guest | Submit service request |

### AI Finance (Manager Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai-finance/data-summary` | Dataset overview |
| `GET` | `/api/ai-finance/summary` | Week-over-week metrics |
| `GET` | `/api/ai-finance/revenue-trend` | Daily revenue trend |
| `GET` | `/api/ai-finance/occupancy-trend` | Daily occupancy trend |
| `POST` | `/api/ai-finance/forecast` | Revenue & occupancy forecast |
| `POST` | `/api/ai-finance/pricing-recommendations` | Dynamic pricing suggestions |

### Error Response Format

All errors follow a consistent shape:
```json
{
  "timestamp": "2026-05-27T12:00:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Selected room is not available for the requested dates",
  "path": "/api/reservations/71",
  "validationErrors": []
}
```

---

## Database Schema

The database is managed through **25 Flyway migrations** that run automatically on startup.

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Staff and guest accounts |
| `rooms` | Physical room inventory |
| `room_types` | Room categories with base rates |
| `reservations` | Booking records with full status tracking |
| `payments` | Payment transactions |
| `expenses` | Categorized expense records |
| `audit_logs` | System-wide change tracking |
| `email_log` | Email delivery status (SENT/FAILED) |
| `services` | Hotel service catalog |
| `service_usage` | Service charges per reservation |
| `inventory_items` | Inventory stock levels |
| `inventory_transactions` | Stock movement history |
| `hotels_service_requests` | Guest service requests |
| `notifications` | Notification queue with retry state |
| `guest_assistants` | AI chatbot conversations |
| `reservation_history` | Reservation status change log |
| `reservation_audits` | Reservation event audit trail |
| `invoice_delivery_logs` | Invoice email tracking |
| `ai_price_recommendations` | ML pricing suggestion records |
| `password_reset_tokens` | Account recovery tokens |

---

## AI Service

The AI service is an independent Python microservice that provides machine learning capabilities.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/model-info` | GET | Model metadata and training info |
| `/forecast/full` | POST | Revenue and occupancy forecast |
| `/pricing/recommendations` | POST | Dynamic pricing suggestions |

### Models

- **Revenue Forecaster** - RandomForestRegressor trained on historical revenue data
- **Occupancy Predictor** - RandomForestRegressor for occupancy rate prediction
- **Price Elasticity Model** - Estimates demand sensitivity to price changes

### Training

```bash
cd ai-service
python train.py
```

The training script pulls data from the Spring Boot API first, falling back to CSV files in `data/`.

---

## Authentication & Authorization

Roomify uses **stateless JWT authentication** with role-based access control.

### Roles

| Role | Access Level |
|------|-------------|
| `ROLE_ADMIN` | Full system access |
| `ROLE_MANAGER` | Dashboard, analytics, staff management, all reservations |
| `ROLE_STAFF` | Reservations, check-in/out, service requests, inventory |
| `ROLE_GUEST` | Own reservations, billing, service requests, assistant |

### JWT Configuration

- **Token lifetime:** 24 hours
- **Algorithm:** HMAC-SHA
- **Filter chain:** `JwtAuthenticationFilter` extracts and validates tokens on every request
- **Method-level security:** `@PreAuthorize` annotations on controller methods

### Demo Credentials

When `ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true`, the following account is seeded:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@roomify.com` | `RealAdminPass123!` |

Additional staff and guest accounts can be created through the admin panel or signup page.

---

## Internationalization

The frontend supports **Arabic** and **English** using i18next.

- Translation files are managed through `src/i18n.js`
- RTL layout is automatically applied for Arabic
- The guest assistant supports multi-language conversations
- Language can be toggled from the UI

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
mvn -B clean test

# Run reservation hardening suite only
mvn -B "-Dtest=ReservationServiceTest,ReservationServiceIT,ReservationIntegrationTest" test
```

- **Unit tests** - Service layer with Mockito mocks
- **Integration tests** - Full Spring context with H2 in-memory database
- **Security tests** - Authentication and authorization flows

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests once (CI mode)
npm test -- --run

# Lint check
npm run lint

# Production build
npm run build
```

- **Component tests** - React Testing Library with jsdom
- **Test runner** - Vitest with globals enabled
- **Setup** - Stubs for IntersectionObserver, ResizeObserver, and i18n

---

## CI/CD

GitHub Actions pipelines run on every push and pull request to `develop` and `main`.

### Backend Pipeline (`.github/workflows/backend-ci.yml`)
- Triggers on changes to `backend/**`
- Java 25 + Maven
- Runs `mvn -B clean test`
- Uploads test reports as artifacts

### Frontend Pipeline (`.github/workflows/frontend-ci.yml`)
- Triggers on changes to `frontend/**`
- Node.js 22
- Runs lint, test, and build
- Caches npm dependencies

---

## Demo Mode

Demo mode seeds the database with sample data for demonstrations and testing.

**Enable it** by setting `ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true` (the startup scripts do this automatically).

### Seeded Demo Reservations

| Confirmation | Purpose |
|-------------|---------|
| `DEMO-CHECKIN-READY` | Ready for check-in demonstration |
| `DEMO-CHECKIN-BLOCKED` | Check-in blocked scenario |
| `DEMO-CANCEL` | Cancellation flow |
| `DEMO-MODIFY` | Modification flow |
| `DEMO-MODIFY-CONFLICT` | Modification with conflict |

### Smoke Testing

A complete smoke test runbook is available at [`docs/demo-smoke-runbook.md`](docs/demo-smoke-runbook.md) covering:
- Room search and availability
- Reservation creation and confirmation
- Check-in and check-out flows
- Cancellation and modification
- Email verification via Mailpit
- Invoice generation

### Dev Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Frontend | [http://localhost:3000](http://localhost:3000) | Application UI |
| Backend API | [http://localhost:8080/api](http://localhost:8080/api) | REST API |
| Mailpit Web UI | [http://localhost:8025](http://localhost:8025) | Email capture viewer |
| AI Service | [http://localhost:8000/docs](http://localhost:8000/docs) | FastAPI Swagger docs |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run the test suites:
   ```bash
   cd backend && mvn -B clean test
   cd ../frontend && npm test -- --run && npm run lint && npm run build
   ```
5. Commit your changes (`git commit -m "Add your feature"`)
6. Push to your branch (`git push origin feature/your-feature`)
7. Open a Pull Request

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with Spring Boot, React, and FastAPI
</p>
