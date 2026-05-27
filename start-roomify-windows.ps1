param(
    [switch]$SkipAiService
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Reliable local demo startup for Windows PowerShell.
# Starts Docker infra, launches the backend with demo bootstrap enabled,
# waits for readiness, and prints the exact next manual frontend step.

$RepoRoot = $PSScriptRoot
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'
$AiServiceDir = Join-Path $RepoRoot 'ai-service'
$ComposeFile = Join-Path $RepoRoot 'docker-compose.yml'
$BackendLog = Join-Path $BackendDir 'demo-backend.log'
$BackendPidFile = Join-Path $BackendDir 'demo-backend.pid'
$FrontendLog = Join-Path $FrontendDir 'demo-frontend.log'
$FrontendPidFile = Join-Path $FrontendDir 'demo-frontend.pid'

$DbPort = 5433
$BackendPort = 8080
$AiServicePort = 8000
$MailpitSmtpPort = 1025
$MailpitHttpPort = 8025
$BackendHealthUrl = "http://127.0.0.1:$BackendPort/api/health"
$AiServiceHealthUrl = "http://127.0.0.1:$AiServicePort/health"
$FrontendHealthUrl = 'http://127.0.0.1:3000'
$AppUrl = 'http://localhost:3000'
$LoginUrl = "$AppUrl/login"
$MailpitUrl = "http://127.0.0.1:$MailpitHttpPort"
$DemoAccessNote = 'Demo password shortcuts are disabled. Use the seeded real admin credentials for this environment.'
$AiServiceStatus = 'not started'
$FrontendStatus = 'not started'
$DockerComposeCommand = $null

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
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

function Initialize-DockerComposeCommand {
    try {
        & docker compose version *> $null
        if ($LASTEXITCODE -eq 0) {
            $script:DockerComposeCommand = 'docker compose'
            return
        }
    }
    catch {
    }

    try {
        & docker-compose version *> $null
        if ($LASTEXITCODE -eq 0) {
            $script:DockerComposeCommand = 'docker-compose'
            return
        }
    }
    catch {
    }

    Stop-Script "Docker Compose is required. Install Docker Compose v2 or ensure 'docker-compose' is available after Docker Desktop is up."
}

function Invoke-DockerCompose {
    param([string[]]$Arguments)

    if ($DockerComposeCommand -eq 'docker compose') {
        & docker compose @Arguments
        return
    }

    & docker-compose @Arguments
}

function Show-FrontendLogTail {
    if (Test-Path -LiteralPath $FrontendLog) {
        Write-Host ''
        Write-Host 'Last frontend log lines:' -ForegroundColor Yellow
        Get-Content -LiteralPath $FrontendLog -Tail 40
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

function Test-AiServiceHealth {
    try {
        $response = Invoke-WebRequest -Uri $AiServiceHealthUrl -TimeoutSec 2 -UseBasicParsing
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
    }
    catch {
        return $false
    }
}

function Test-FrontendHealth {
    try {
        $response = Invoke-WebRequest -Uri $FrontendHealthUrl -TimeoutSec 2 -UseBasicParsing
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    }
    catch {
        return $false
    }
}

function Test-AiServicePythonImports {
    param([string]$PythonPath)

    try {
        & $PythonPath -c "import fastapi, uvicorn, pandas, sklearn, joblib, pydantic, requests, numpy" *> $null
        return ($LASTEXITCODE -eq 0)
    }
    catch {
        return $false
    }
}

function Start-AiFinanceService {
    if ($SkipAiService) {
        Write-Info 'Skipping AI Finance FastAPI startup. Spring Boot fallback mode will be available if needed.'
        $script:AiServiceStatus = 'skipped'
        return
    }

    if (-not (Test-Path -LiteralPath $AiServiceDir -PathType Container)) {
        Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. ai-service folder was not found.'
        $script:AiServiceStatus = 'missing ai-service folder'
        return
    }

    if (Test-AiServiceHealth) {
        Write-Ok "AI service already running on port $AiServicePort"
        $script:AiServiceStatus = 'already running'
        return
    }

    if (Test-TcpPort -TargetHost '127.0.0.1' -Port $AiServicePort) {
        Write-Warn "AI service startup failed; Spring Boot safe fallback will still work. Port $AiServicePort is already in use, but $AiServiceHealthUrl did not respond."
        $script:AiServiceStatus = "port $AiServicePort in use"
        return
    }

    Write-Info 'Starting AI Finance FastAPI service...'

    $venvDir = Join-Path $AiServiceDir '.venv'
    $pythonPath = Join-Path $venvDir 'Scripts\python.exe'
    $requirementsPath = Join-Path $AiServiceDir 'requirements.txt'

    if (-not (Test-Path -LiteralPath $pythonPath -PathType Leaf)) {
        if (-not (Get-Command 'py' -ErrorAction SilentlyContinue)) {
            Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. Python launcher "py" was not found in PATH.'
            $script:AiServiceStatus = 'python missing'
            return
        }

        try {
            Push-Location $AiServiceDir
            & py -m venv .venv
            if ($LASTEXITCODE -ne 0) {
                Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. Could not create ai-service\.venv.'
                $script:AiServiceStatus = 'venv creation failed'
                return
            }
        }
        catch {
            Write-Warn "AI service startup failed; Spring Boot safe fallback will still work. Could not create ai-service\.venv. $($_.Exception.Message)"
            $script:AiServiceStatus = 'venv creation failed'
            return
        }
        finally {
            Pop-Location
        }
    }

    if (-not (Test-Path -LiteralPath $pythonPath -PathType Leaf)) {
        Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. ai-service\.venv\Scripts\python.exe was not found.'
        $script:AiServiceStatus = 'venv python missing'
        return
    }

    if (-not (Test-Path -LiteralPath $requirementsPath -PathType Leaf)) {
        Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. ai-service\requirements.txt was not found.'
        $script:AiServiceStatus = 'requirements missing'
        return
    }

    if (-not (Test-AiServicePythonImports -PythonPath $pythonPath)) {
        Write-Info 'Installing AI service Python requirements...'
        Push-Location $AiServiceDir
        try {
            & $pythonPath -m pip install -r requirements.txt
            if ($LASTEXITCODE -ne 0) {
                Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. Python requirements install failed.'
                $script:AiServiceStatus = 'requirements install failed'
                return
            }
        }
        catch {
            Write-Warn "AI service startup failed; Spring Boot safe fallback will still work. Python requirements install failed. $($_.Exception.Message)"
            $script:AiServiceStatus = 'requirements install failed'
            return
        }
        finally {
            Pop-Location
        }
    }

    $escapedAiServiceDir = $AiServiceDir.Replace("'", "''")
    $escapedPythonPath = $pythonPath.Replace("'", "''")
    $aiCommand = "Set-Location -LiteralPath '$escapedAiServiceDir'; & '$escapedPythonPath' -m uvicorn main:app --reload --port $AiServicePort"

    try {
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $aiCommand) -WorkingDirectory $AiServiceDir | Out-Null
        $script:AiServiceStatus = 'starting'
    }
    catch {
        Write-Warn "AI service startup failed; Spring Boot safe fallback will still work. $($_.Exception.Message)"
        $script:AiServiceStatus = 'startup failed'
        return
    }

    Start-Sleep -Seconds 3
    if (Test-AiServiceHealth) {
        Write-Ok "AI Finance FastAPI service is responding at $AiServiceHealthUrl."
        $script:AiServiceStatus = 'ready'
    }
    else {
        Write-Warn 'AI service startup failed; Spring Boot safe fallback will still work. FastAPI did not answer /health yet; check the AI service PowerShell window for details.'
        $script:AiServiceStatus = 'health not ready'
    }
}

function Start-Frontend {
    if (Test-FrontendHealth) {
        Write-Ok "Frontend already running at $AppUrl"
        $script:FrontendStatus = 'already running'
        return
    }

    if (Test-TcpPort -TargetHost '127.0.0.1' -Port 3000) {
        Stop-ProcessesOnPort -Port 3000
    }

    Test-RequiredCommand -CommandName 'npm.cmd' -Message 'npm is required but was not found in PATH.'

    $nodeModulesPath = Join-Path $FrontendDir 'node_modules'
    if (-not (Test-Path -LiteralPath $nodeModulesPath -PathType Container)) {
        Stop-Script "frontend\node_modules is missing. Run 'npm install' inside $FrontendDir, then retry."
    }

    Write-Info "Starting frontend at $AppUrl..."
    '' | Set-Content -LiteralPath $FrontendLog
    $frontendCommand = "npm.cmd run dev -- --host 127.0.0.1 >> `"$FrontendLog`" 2>&1"
    $frontendProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $frontendCommand -WorkingDirectory $FrontendDir -PassThru -WindowStyle Hidden
    $frontendProcess.Id | Set-Content -LiteralPath $FrontendPidFile
    $script:FrontendStatus = 'starting'

    for ($elapsed = 0; $elapsed -lt 60; $elapsed++) {
        $frontendProcess.Refresh()
        if ($frontendProcess.HasExited) {
            Show-FrontendLogTail
            if (Test-Path -LiteralPath $FrontendPidFile) {
                Remove-Item -LiteralPath $FrontendPidFile -Force
            }
            Stop-Script 'Frontend process exited before it became ready.'
        }

        if (Test-FrontendHealth) {
            Write-Ok "Frontend is ready at $AppUrl."
            $script:FrontendStatus = 'ready'
            return
        }

        Start-Sleep -Seconds 1
    }

    Show-FrontendLogTail
    Stop-Script "Frontend did not become ready at $AppUrl within 60s."
}

function Write-ReadySummary {
    Write-Host ''
    Write-Host 'Ready checklist' -ForegroundColor White
    Write-Host '- Postgres: ready'
    Write-Host '- Mailpit: ready'
    Write-Host '- Backend: ready'
    Write-Host "- AI Finance FastAPI: $AiServiceStatus"
    Write-Host "- Frontend: $FrontendStatus"
    Write-Host "- App: $AppUrl"
    Write-Host "- Login: $LoginUrl"
    Write-Host "- Mail inbox: $MailpitUrl"
    Write-Host "- AI service health: $AiServiceHealthUrl"
    Write-Host "- Demo access: $DemoAccessNote"
    Write-Host "- Backend log: $BackendLog"
    Write-Host "- Backend PID file: $BackendPidFile"
    Write-Host "- Frontend log: $FrontendLog"
    Write-Host "- Frontend PID file: $FrontendPidFile"
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

$FrontendEnvExample = Join-Path $FrontendDir '.env.example'
$FrontendEnv = Join-Path $FrontendDir '.env'
if ((Test-Path -LiteralPath $FrontendEnvExample) -and -not (Test-Path -LiteralPath $FrontendEnv)) {
    Write-Info "Creating frontend/.env from .env.example..."
    Copy-Item -LiteralPath $FrontendEnvExample -Destination $FrontendEnv
}

Initialize-DockerComposeCommand

try {
    & docker ps *> $null
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
    Invoke-DockerCompose -Arguments @('up', '-d', 'postgres', 'mailpit')
    if ($LASTEXITCODE -ne 0) {
        Stop-Script "$DockerComposeCommand up failed. Check Docker and whether ports 5433, 1025, or 8025 are already in use."
    }

    try {
        $previousErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        Invoke-DockerCompose -Arguments @('stop', 'backend') *> $null
    }
    catch {
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
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
$env:ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED = 'false'
$env:SPRING_FLYWAY_BASELINE_ON_MIGRATE = 'true'
$env:SPRING_FLYWAY_BASELINE_VERSION = '12'
$env:SPRING_MAIL_HOST = '127.0.0.1'
$env:SPRING_MAIL_PORT = '1025'
$env:SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH = 'false'
$env:SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE = 'false'
$env:ROOMIFY_MAIL_FROM = 'no-reply@roomify.local'
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

Start-AiFinanceService

Write-Info "Waiting for backend health at $BackendHealthUrl..."
Wait-ForBackend -Process $backendProcess -TimeoutSeconds 120
Write-Ok 'Backend is ready.'

Start-Frontend

Write-ReadySummary
