@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "LOG_FILE=%ROOT%codex-login-fix.log"

cd /d "%BACKEND_DIR%"
set "DB_PORT=5432"
set "ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true"
call mvn.cmd -Dmaven.test.skip=true spring-boot:run >> "%LOG_FILE%" 2>&1
