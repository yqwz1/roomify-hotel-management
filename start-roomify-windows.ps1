param()

Write-Host "Starting Roomify Automation Script (Windows/PowerShell)..." -ForegroundColor Cyan

# ==========================================
# 1. Docker & Database Check
# ==========================================
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Docker does not seem to be running." -ForegroundColor Red
        Write-Host "[>] Please open Docker Desktop, wait for it to start, and run this script again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "[X] Docker is not installed or not running in the current PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[+] Docker is running. Starting PostgreSQL..." -ForegroundColor Green
docker compose up -d postgres

Write-Host "Waiting for PostgreSQL to be ready on port 5433..." -ForegroundColor Yellow
$postgresReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $connection = Test-NetConnection -ComputerName "localhost" -Port 5433 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($connection) {
        $postgresReady = $true
        break
    }
    Start-Sleep -Seconds 1
}

if (-not $postgresReady) {
    Write-Host "[X] Timed out waiting for PostgreSQL to start. Please check Docker logs." -ForegroundColor Red
    exit 1
}
Write-Host "[+] PostgreSQL is fully ready and accepting connections!" -ForegroundColor Green

# ==========================================
# 2. Process Cleanup & Backend Startup
# ==========================================
Write-Host "Checking for port 8080 conflicts..." -ForegroundColor Cyan
$blockingProcess = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($blockingProcess) {
    Write-Host "[!] Port 8080 is in use. Terminating existing process..." -ForegroundColor Yellow
    foreach ($proc in $blockingProcess) {
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

$backendProcess = $null
$frontendProcess = $null

try {
    Write-Host "Starting Spring Boot Backend..." -ForegroundColor Cyan
    Push-Location backend
    $env:DB_PORT="5433"
    
    # Start Maven via Start-Process
    $backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c .\mvnw.cmd spring-boot:run" -PassThru -WindowStyle Hidden -RedirectStandardOutput "backend.log" -RedirectStandardError "backend_err.log"
    Pop-Location
    Write-Host "[+] Backend starting in background (PID: $($backendProcess.Id)). Logs at backend/backend.log" -ForegroundColor Green

    # Give backend a head start
    Start-Sleep -Seconds 3

# ==========================================
# 3. Frontend Startup
# ==========================================
    Write-Host "Starting Vite React Frontend..." -ForegroundColor Cyan
    Push-Location frontend
    $frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -PassThru -WindowStyle Hidden -RedirectStandardOutput "frontend.log" -RedirectStandardError "frontend_err.log"
    Pop-Location
    Write-Host "[+] Frontend starting in background (PID: $($frontendProcess.Id)). Logs at frontend/frontend.log" -ForegroundColor Green

    Write-Host ""
    Write-Host "[*] Roomify is up and running!" -ForegroundColor Magenta
    Write-Host "[>] Backend Logs: Get-Content backend\backend.log -Wait -Tail 10" -ForegroundColor Cyan
    Write-Host "[>] Frontend Logs: Get-Content frontend\frontend.log -Wait -Tail 10" -ForegroundColor Cyan
    Write-Host "[!] Press [Ctrl+C] to gracefully stop all services." -ForegroundColor Yellow

    # Keep script alive to wait for Ctrl+C
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
# ==========================================
# 4. Cleanup on Exit
# ==========================================
    Write-Host ""
    Write-Host "Shutting down Roomify services..." -ForegroundColor Yellow
    
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Write-Host "Killing Frontend (PID: $($frontendProcess.Id))..." -ForegroundColor Cyan
        # Using taskkill with /T to kill the process tree (since we used cmd /c)
        taskkill /T /F /PID $frontendProcess.Id 2>&1 | Out-Null
    }
    
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host "Killing Backend (PID: $($backendProcess.Id))..." -ForegroundColor Cyan
        taskkill /T /F /PID $backendProcess.Id 2>&1 | Out-Null
    }
    
    Write-Host "[+] Cleanup complete. No dangling ports! Goodbye." -ForegroundColor Green
}
