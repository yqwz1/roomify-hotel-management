@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "AI_DIR=%ROOT%ai-service"
set "LOG_FILE=%ROOT%codex-login-fix.log"

REM --- Start the FastAPI AI Finance service (port 8000), non-blocking. ---
REM Never fatal: on any failure we warn and continue so the backend still runs
REM (Spring Boot has a safe fallback when the AI service is unreachable).
if exist "%AI_DIR%\main.py" (
    if not exist "%AI_DIR%\.venv\Scripts\python.exe" (
        echo Creating AI service virtualenv...
        py -m venv "%AI_DIR%\.venv"
        if exist "%AI_DIR%\.venv\Scripts\python.exe" (
            "%AI_DIR%\.venv\Scripts\python.exe" -m pip install -r "%AI_DIR%\requirements.txt"
        )
    )
    if exist "%AI_DIR%\.venv\Scripts\python.exe" (
        echo Starting AI Finance service on http://127.0.0.1:8000 ...
        start "roomify-ai-service" /min "%AI_DIR%\.venv\Scripts\python.exe" -m uvicorn main:app --port 8000 --app-dir "%AI_DIR%"
    ) else (
        echo WARNING: AI service venv unavailable; continuing without it.
    )
) else (
    echo WARNING: ai-service folder not found; continuing without it.
)

cd /d "%BACKEND_DIR%"
set "DB_PORT=5432"
set "ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true"
call mvn.cmd -Dmaven.test.skip=true spring-boot:run >> "%LOG_FILE%" 2>&1
