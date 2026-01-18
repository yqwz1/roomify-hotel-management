# Roomify Hotel Management System

A starter monorepo for a Hotel Management System built with **Spring Boot (Java 17)** and **React (Vite)**.

## 🏨 Planned Features
- User authentication and role-based access control
- Room reservation and availability management
- Check-in / Check-out operations
- Billing and payment processing (ZATCA-ready approach)
- Service management (restaurant, laundry)
- Notifications
- Reports and dashboards

## 🛠️ Tech Stack

**Backend**
- Java 17
- Spring Boot 3
- Maven
- (Starter) REST + Health endpoint

**Frontend**
- React 18
- Vite
- ESLint
- Vitest (unit tests)

## 📁 Project Structure

```
roomify-hotel-management/
├── backend/                  # Spring Boot application
├── frontend/                 # React application (Vite)
├── docs/                     # Documentation
└── .github/workflows/        # GitHub Actions CI
```

## 🚀 Quick Start

### Backend
```bash
cd backend
./mvnw spring-boot:run   # macOS/Linux
mvnw.cmd spring-boot:run # Windows
```
Backend runs on `http://localhost:8080`

Health endpoint: `GET /api/health`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## 🔄 Suggested Workflow
- Work from `develop`
- Create feature branches: `feature/<short-name>`
- PR into `develop`
- PR from `develop` into `main` for releases

## 📝 License
MIT
