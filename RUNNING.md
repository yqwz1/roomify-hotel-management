# How to Run Roomify

## ⚡ Quick Start (Windows Users)

**Simple one-command approach:**

### Check if Backend is Running
```powershell
cd backend
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess, State
```
If this returns nothing, the backend is NOT running.

### Stop Backend (if running)
```powershell
cd backend
$p = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force; Write-Host "✅ Backend stopped" } else { Write-Host "ℹ️ Backend not running" }
```

### Start Backend
```powershell
cd backend
./mvnw spring-boot:run
```

---

## 📋 Manual Steps

Follow these 3 steps every time you want to start the application.

## 1. Start the Database (Docker)
Ensure Docker Desktop is open, then run:
```bash
docker-compose up -d
```
*You only need to do this once per session.*

## 2. Start the Backend
Open a terminal, navigate to the `backend` folder, and run:
```bash
cd backend
./mvnw spring-boot:run
```
*Wait for "Started RoomifyBackendApplication"*

> [!IMPORTANT]
> To stop the backend, press **Ctrl+C** in the terminal. Do not just close the window.

## 3. Start the Frontend
Open a **new** terminal window, navigate to the `frontend` folder, and run:
```bash
cd frontend
npm run dev
```

## 4. Access the App
Open your browser to: [http://localhost:5173](http://localhost:5173)

---

## Troubleshooting

### "Port 8080 was already in use"
If you see this error, it means the backend is already running in the background. 

**Windows (PowerShell) - Try these in order:**

Option 1 (Simple):
```powershell
$process = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }
```

Option 2 (If Option 1 doesn't work):
```powershell
netstat -ano | findstr :8080
```
This will show you the PID (last column). Then run:
```powershell
taskkill /PID <PID_NUMBER> /F
```
Replace `<PID_NUMBER>` with the actual number from the previous command.

**Linux/macOS:**
```bash
lsof -ti:8080 | xargs kill -9
```

Then try running the backend again.
