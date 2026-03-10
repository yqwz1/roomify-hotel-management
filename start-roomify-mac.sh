#!/bin/bash

# start-roomify.sh
# A robust single-click startup script for the Roomify project on macOS.

echo "🚀 Starting Roomify Automation Script..."

# ==========================================
# 1. Docker & Database Check
# ==========================================
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker does not seem to be running."
    echo "👉 Please open Docker Desktop, wait for it to start, and run this script again."
    exit 1
fi

echo "✅ Docker is running. Starting PostgreSQL..."
# Run the docker compose command. Make sure this is run from the directory containing your docker-compose.yml 
docker compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready on port 5433..."
# Loop until Netcat (nc) can successfully connect to localhost:5433
while ! nc -z localhost 5433; do
  sleep 1
done
echo "✅ PostgreSQL is fully ready and accepting connections!"

# ==========================================
# Process Tracking & Cleanup
# ==========================================
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "🛑 Shutting down Roomify services..."
    
    if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null; then
        echo "Killing Frontend (PID: $FRONTEND_PID)..."
        # Using kill -9 or child killing if needed, but a standard TERM signal often works locally
        pkill -P $FRONTEND_PID 2>/dev/null || kill -15 $FRONTEND_PID 2>/dev/null
    fi

    if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
        echo "Killing Backend (PID: $BACKEND_PID)..."
        pkill -P $BACKEND_PID 2>/dev/null || kill -15 $BACKEND_PID 2>/dev/null
    fi

    echo "✅ Cleanup complete. No dangling ports! Goodbye."
    exit 0
}

# Trap Ctrl+C (SIGINT) and call the cleanup function
trap cleanup SIGINT

# ==========================================
# 2. Backend Startup
# ==========================================
echo "🔍 Checking for port 8080 conflicts..."
# lsof -t -i:8080 returns the PID if the port is busy
if lsof -t -i:8080 >/dev/null 2>&1; then
    echo "⚠️ Port 8080 is in use. Terminating existing process..."
    lsof -t -i:8080 | xargs kill -9
    sleep 2
fi

echo "⚙️ Starting Spring Boot Backend..."
cd backend || { echo "❌ Backend directory not found!"; exit 1; }
# Export DB_PORT explicitly if you rely on it
export DB_PORT="5433"
./mvnw spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend starting in background (PID: $BACKEND_PID). Logs at backend/backend.log"
cd ..

# Give the backend a few seconds head start
sleep 3

# ==========================================
# 3. Frontend Startup
# ==========================================
echo "🌐 Starting Vite React Frontend..."
cd frontend || { echo "❌ Frontend directory not found!"; exit 1; }
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend starting in background (PID: $FRONTEND_PID). Logs at frontend/frontend.log"
cd ..

echo ""
echo "🎉 Roomify is up and running!"
echo "👉 Backend Logs: tail -f backend/backend.log"
echo "👉 Frontend Logs: tail -f frontend/frontend.log"
echo "⚠️ Press [Ctrl+C] to gracefully stop all services."

# Wait indefinitely to keep the script running, so the trap can catch Ctrl+C
wait
