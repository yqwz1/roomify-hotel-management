param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Reliable local demo startup for Windows PowerShell.
# Starts Docker infra, launches the backend with demo bootstrap enabled,
# waits for readiness, and prints the exact next manual frontend step.

$RepoRoot = $PSScriptRoot
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'
$ComposeFile = Join-Path $RepoRoot 'docker-compose.yml'
$BackendLog = Join-Path $BackendDir 'demo-backend.log'
$BackendPidFile = Join-Path $BackendDir 'demo-backend.pid'

$DbPort = 5433
$BackendPort = 8080
$MailpitSmtpPort = 1025
$MailpitHttpPort = 8025
$BackendHealthUrl = "http://127.0.0.1:$BackendPort/api/health"
$AppUrl = 'http://localhost:3000'
$LoginUrl = "$AppUrl/login"
$MailpitUrl = "http://127.0.0.1:$MailpitHttpPort"
$DemoCredentials = 'admin@roomify.com / password123'

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Stop-Script {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Test-RequiredCommand {
    param(
        [string]$CommandName,
        [string]$Message
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Stop-Script $Message
    }
}

function Assert-File {
    param(
        [string]$Path,
        [string]$Message
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Stop-Script $Message
    }
}

function Test-TcpPort {
    param(
        [string]$TargetHost,
        [int]$Port
    )

    $client = $null

    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $async = $client.BeginConnect($TargetHost, $Port, $null, $null)
        $connected = $async.AsyncWaitHandle.WaitOne(1000, $false)

        if (-not $connected) {
            return $false
        }

        $client.EndConnect($async)
        return $true
    }
    catch {
        return $false
    }
    finally {
        if ($client) {
            $client.Dispose()
        }
    }
}

function Wait-ForTcp {
    param(
        [string]$Name,
        [string]$TargetHost,
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )

    for ($elapsed = 0; $elapsed -lt $TimeoutSeconds; $elapsed++) {
        if (Test-TcpPort -TargetHost $TargetHost -Port $Port) {
            return
        }

        Start-Sleep -Seconds 1
    }

    Stop-Script "$Name did not become reachable on ${TargetHost}:$Port within ${TimeoutSeconds}s."
}

function Stop-BackendProcess {
    param([System.Diagnostics.Process]$Process)

    if ($null -eq $Process) {
        if (Test-Path -LiteralPath $BackendPidFile) {
            Remove-Item -LiteralPath $BackendPidFile -Force
        }
        return
    }

    try {
        if (-not $Process.HasExited) {
            taskkill /T /F /PID $Process.Id | Out-Null
        }
    }
    catch {
    }

    if (Test-Path -LiteralPath $BackendPidFile) {
        Remove-Item -LiteralPath $BackendPidFile -Force
    }
}

function Clear-StaleBackendPidFile {
    if (-not (Test-Path -LiteralPath $BackendPidFile)) {
        return
    }

    $recordedPid = (Get-Content -LiteralPath $BackendPidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    $parsedPid = 0

    if (-not [int]::TryParse([string]$recordedPid, [ref]$parsedPid)) {
        Remove-Item -LiteralPath $BackendPidFile -Force
        return
    }

    $existingProcess = Get-Process -Id $parsedPid -ErrorAction SilentlyContinue
    if (-not $existingProcess) {
        Remove-Item -LiteralPath $BackendPidFile -Force
    }
}

function Show-BackendLogTail {
    if (Test-Path -LiteralPath $BackendLog) {
        Write-Host ''
        Write-Host 'Last backend log lines:' -ForegroundColor Yellow
        Get-Content -LiteralPath $BackendLog -Tail 40
    }
}

function Wait-ForBackend {
    param(
        [System.Diagnostics.Process]$Process,
        [int]$TimeoutSeconds = 120
    )

    for ($elapsed = 0; $elapsed -lt $TimeoutSeconds; $elapsed++) {
        $Process.Refresh()
        if ($Process.HasExited) {
            Show-BackendLogTail
            Stop-BackendProcess -Process $Process
            Stop-Script 'Backend process exited before it became ready.'
        }

        try {
            $response = Invoke-WebRequest -Uri $BackendHealthUrl -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200 -and $response.Content -match '"status"\s*:\s*"ok"') {
                return
            }
        }
        catch {
        }

        Start-Sleep -Seconds 1
    }

    Show-BackendLogTail
    Stop-BackendProcess -Process $Process
    Stop-Script "Backend did not become ready at $BackendHealthUrl within ${TimeoutSeconds}s."
}

function Write-ReadySummary {
    Write-Host ''
    Write-Host 'Ready checklist' -ForegroundColor White
    Write-Host '- Postgres: ready'
    Write-Host '- Mailpit: ready'
    Write-Host '- Backend: ready'
    Write-Host "- Frontend: run manually with ``Set-Location `"$FrontendDir`"; npm run dev``"
    Write-Host "- App: $AppUrl"
    Write-Host "- Login: $LoginUrl"
    Write-Host "- Mail inbox: $MailpitUrl"
    Write-Host "- Demo credentials: $DemoCredentials"
    Write-Host "- Backend log: $BackendLog"
    Write-Host "- Backend PID file: $BackendPidFile"
}

function Stop-ProcessesOnPort {
    param([int]$Port)

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique

    if (-not $listeners) {
        Clear-StaleBackendPidFile
        return
    }

    Write-Info "Port $Port is in use. Stopping existing process..."

    foreach ($owningProcessId in $listeners) {
        try {
            taskkill /T /F /PID $owningProcessId | Out-Null
        }
        catch {
        }
    }

    Start-Sleep -Seconds 2

    $stillListening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($stillListening) {
        Stop-Script "Port $Port is still in use after attempting cleanup."
    }

    Clear-StaleBackendPidFile
    Write-Ok 'Existing process stopped.'
    Write-Info 'Continuing Roomify startup...'
}

Test-RequiredCommand -CommandName 'docker' -Message 'Docker is required but was not found in PATH.'
Assert-File -Path $ComposeFile -Message "docker-compose.yml was not found in $RepoRoot."
Assert-File -Path (Join-Path $BackendDir 'mvnw.cmd') -Message "The backend Maven wrapper is missing at $BackendDir\mvnw.cmd."
Assert-File -Path (Join-Path $FrontendDir 'package.json') -Message "frontend\package.json is missing at $FrontendDir\package.json."

try {
    & docker compose version *> $null
    if ($LASTEXITCODE -ne 0) {
        Stop-Script "Docker Compose v2 is required. Run 'docker compose version' after Docker Desktop is up."
    }
}
catch {
    Stop-Script "Docker Compose v2 is required. Run 'docker compose version' after Docker Desktop is up."
}

try {
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Stop-Script 'Docker is not running. Start Docker Desktop and retry.'
    }
}
catch {
    Stop-Script 'Docker is not running. Start Docker Desktop and retry.'
}

Write-Info 'Starting demo infrastructure with docker compose...'
Push-Location $RepoRoot
try {
    & docker compose up -d postgres mailpit
    if ($LASTEXITCODE -ne 0) {
        Stop-Script 'docker compose up failed. Check Docker and whether ports 5433, 1025, or 8025 are already in use.'
    }
}
finally {
    Pop-Location
}

Write-Info "Waiting for Postgres on 127.0.0.1:$DbPort..."
Wait-ForTcp -Name 'Postgres' -TargetHost '127.0.0.1' -Port $DbPort -TimeoutSeconds 60
Write-Ok 'Postgres is ready.'

Write-Info "Waiting for Mailpit SMTP on 127.0.0.1:$MailpitSmtpPort..."
Wait-ForTcp -Name 'Mailpit SMTP' -TargetHost '127.0.0.1' -Port $MailpitSmtpPort -TimeoutSeconds 60

Write-Info "Waiting for Mailpit UI on 127.0.0.1:$MailpitHttpPort..."
Wait-ForTcp -Name 'Mailpit UI' -TargetHost '127.0.0.1' -Port $MailpitHttpPort -TimeoutSeconds 60
Write-Ok 'Mailpit is ready.'

Stop-ProcessesOnPort -Port $BackendPort

Write-Info "Starting backend with DB_PORT=$DbPort and ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true..."
Clear-StaleBackendPidFile
'' | Set-Content -LiteralPath $BackendLog

$env:DB_PORT = "$DbPort"
$env:ROOMIFY_DEMO_BOOTSTRAP_ENABLED = 'true'
$env:SPRING_FLYWAY_BASELINE_ON_MIGRATE = 'true'
$env:SPRING_FLYWAY_BASELINE_VERSION = '12'
$backendCommand = ".\mvnw.cmd spring-boot:run >> `"$BackendLog`" 2>&1"
$backendProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $backendCommand -WorkingDirectory $BackendDir -PassThru -WindowStyle Hidden
$backendProcess.Id | Set-Content -LiteralPath $BackendPidFile

Start-Sleep -Seconds 1
$backendProcess.Refresh()
if ($backendProcess.HasExited) {
    Show-BackendLogTail
    Stop-BackendProcess -Process $backendProcess
    Stop-Script "Backend failed to start. See $BackendLog."
}

Write-Info "Waiting for backend health at $BackendHealthUrl..."
Wait-ForBackend -Process $backendProcess -TimeoutSeconds 120
Write-Ok 'Backend is ready.'

Write-ReadySummary
