Create a comprehensive README.md in the root directory (roomify-hotel-management):
markdown# Roomify - Hotel Management System

A full-stack hotel management application built with React (Frontend) and Spring Boot (Backend).

## 🚀 Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend
- Spring Boot 3.2
- Java 17
- Maven
- PostgreSQL 16

### DevOps
- Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Java 17** - [Download](https://adoptium.net/)
- **Maven** (or use the included wrapper)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git**

## 🛠️ Environment Setup

### 1. Clone the Repository
```bash
git clone 
cd roomify-hotel-management
```

### 2. Database Setup (PostgreSQL with Docker)

Start the PostgreSQL container:
```bash
docker-compose up -d
```

This will create:
- PostgreSQL database: `roomify`
- Username: `roomify_user`
- Password: `roomify_pass`
- Port: `5432`

Verify the container is running:
```bash
docker ps
```

To stop the database:
```bash
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

### 3. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

**Option A: Using Maven Wrapper (Recommended)**
```bash
# On Mac/Linux
./mvnw spring-boot:run

# On Windows
mvnw.cmd spring-boot:run
```

**Option B: Using installed Maven**
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

**Test the backend:**

Open your browser and visit: `http://localhost:8080/api/health`

You should see:
```json
{"status":"ok","timestamp":"2026-01-18T..."}
```

### 4. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.properties`:
```properties
spring.application.name=roomify-backend
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/roomify
spring.datasource.username=roomify_user
spring.datasource.password=roomify_pass
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### Frontend Configuration

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8080/api
```

### Optional root .env

Copy `.env.example` to `.env` and adjust if needed:
```bash
cp .env.example .env
```

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
./mvnw clean package
```

The JAR file will be in `target/roomify-backend-0.0.1-SNAPSHOT.jar`

Run it:
```bash
java -jar target/roomify-backend-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
cd frontend
npm run build
```

The production files will be in `frontend/dist/`

Preview the build:
```bash
npm run preview
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Ensure Docker is running
2. Check if PostgreSQL container is up: `docker ps`
3. Verify credentials in `application.properties`
4. Try restarting the container: `docker-compose restart`

### Backend Won't Start

1. Check if port 8080 is already in use
2. Ensure Java 17 is installed: `java -version`
3. Try cleaning and rebuilding: `./mvnw clean install`

### Frontend Issues

1. Clear node_modules and reinstall:
```bash
   rm -rf node_modules package-lock.json
   npm install
```
2. Check if port 3000 is available
3. Verify `.env` file exists with correct API URL

### CORS Errors

- Make sure the backend CORS configuration in `WebConfig.java` includes `http://localhost:3000`
- Restart the backend after making changes

## 📁 Project Structure
```
roomify-hotel-management/
├── backend/                 # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/roomify/backend/
│   │   │   │       ├── api/          # REST Controllers
│   │   │   │       ├── config/       # Configuration classes
│   │   │   │       └── RoomifyBackendApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml      # Docker configuration
└── README.md              # This file
```

## 🔗 API Endpoints

### Health Check
- **GET** `/api/health` - Check if backend is running

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions, please open an issue on GitHub.
