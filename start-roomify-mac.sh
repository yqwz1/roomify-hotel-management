#!/bin/bash

# Reliable local demo startup for macOS.
# Starts Docker infra, repairs legacy demo schema drift, launches the backend
# with demo bootstrap enabled, then launches the frontend.

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
AI_SERVICE_DIR="$REPO_ROOT/ai-service"
BACKEND_LOG="$BACKEND_DIR/demo-backend.log"
BACKEND_PID_FILE="$BACKEND_DIR/demo-backend.pid"
FRONTEND_LOG="$FRONTEND_DIR/demo-frontend.log"
FRONTEND_PID_FILE="$FRONTEND_DIR/demo-frontend.pid"
AI_SERVICE_LOG="$AI_SERVICE_DIR/demo-ai-service.log"
AI_SERVICE_PID_FILE="$AI_SERVICE_DIR/demo-ai-service.pid"

DB_PORT=5433
BACKEND_PORT=8080
FRONTEND_PORT=3000
AI_SERVICE_PORT=8000
MAILPIT_SMTP_PORT=1025
MAILPIT_HTTP_PORT=8025
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/api/health"
AI_SERVICE_HEALTH_URL="http://127.0.0.1:${AI_SERVICE_PORT}/health"
APP_URL="http://localhost:${FRONTEND_PORT}"
LOGIN_URL="${APP_URL}/login"
MAILPIT_URL="http://127.0.0.1:${MAILPIT_HTTP_PORT}"
DEMO_ACCESS_NOTE="Demo password shortcuts are disabled. Use the seeded real admin credentials for this environment."

BACKEND_PID=""
FRONTEND_PID=""
AI_SERVICE_STATUS="not started"

log() {
    printf '%s\n' "$1"
}

fail() {
    printf 'ERROR: %s\n' "$1" >&2
    exit 1
}

warn() {
    printf 'WARNING: %s\n' "$1" >&2
}

require_command() {
    local command_name="$1"
    local message="$2"
    command -v "$command_name" >/dev/null 2>&1 || fail "$message"
}

assert_file() {
    local path="$1"
    local message="$2"
    [[ -f "$path" ]] || fail "$message"
}

tcp_ready() {
    local host="$1"
    local port="$2"

    if command -v nc >/dev/null 2>&1; then
        nc -z "$host" "$port" >/dev/null 2>&1
        return $?
    fi

    (echo >"/dev/tcp/$host/$port") >/dev/null 2>&1
}

wait_for_tcp() {
    local name="$1"
    local host="$2"
    local port="$3"
    local timeout_seconds="$4"
    local elapsed=0

    while (( elapsed < timeout_seconds )); do
        if tcp_ready "$host" "$port"; then
            return 0
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    fail "${name} did not become reachable on ${host}:${port} within ${timeout_seconds}s."
}

port_in_use() {
    local port="$1"

    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
        return $?
    fi

    tcp_ready "127.0.0.1" "$port"
}

tail_backend_log() {
    if [[ -f "$BACKEND_LOG" ]]; then
        log ""
        log "Last backend log lines:"
        tail -n 40 "$BACKEND_LOG"
    fi
}

cleanup_stale_backend_pid() {
    if [[ ! -f "$BACKEND_PID_FILE" ]]; then
        return
    fi

    local recorded_pid
    recorded_pid="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"

    if [[ -z "$recorded_pid" ]] || ! kill -0 "$recorded_pid" >/dev/null 2>&1; then
        rm -f "$BACKEND_PID_FILE"
    fi
}

cleanup_stale_frontend_pid() {
    if [[ ! -f "$FRONTEND_PID_FILE" ]]; then
        return
    fi

    local recorded_pid
    recorded_pid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"

    if [[ -z "$recorded_pid" ]] || ! kill -0 "$recorded_pid" >/dev/null 2>&1; then
        rm -f "$FRONTEND_PID_FILE"
    fi
}

stop_backend_process() {
    local pid="$1"

    if [[ -z "$pid" ]]; then
        rm -f "$BACKEND_PID_FILE"
        return
    fi

    if kill -0 "$pid" >/dev/null 2>&1; then
        pkill -TERM -P "$pid" >/dev/null 2>&1 || true
        kill -TERM "$pid" >/dev/null 2>&1 || true
        sleep 2

        if kill -0 "$pid" >/dev/null 2>&1; then
            pkill -KILL -P "$pid" >/dev/null 2>&1 || true
            kill -KILL "$pid" >/dev/null 2>&1 || true
        fi
    fi

    rm -f "$BACKEND_PID_FILE"
}

stop_frontend_process() {
    local pid="$1"

    if [[ -z "$pid" ]]; then
        rm -f "$FRONTEND_PID_FILE"
        return
    fi

    if kill -0 "$pid" >/dev/null 2>&1; then
        pkill -TERM -P "$pid" >/dev/null 2>&1 || true
        kill -TERM "$pid" >/dev/null 2>&1 || true
        sleep 2

        if kill -0 "$pid" >/dev/null 2>&1; then
            pkill -KILL -P "$pid" >/dev/null 2>&1 || true
            kill -KILL "$pid" >/dev/null 2>&1 || true
        fi
    fi

    rm -f "$FRONTEND_PID_FILE"
}

stop_processes_on_port() {
    local port="$1"
    local found_pids=""

    if command -v lsof >/dev/null 2>&1; then
        found_pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
    elif command -v fuser >/dev/null 2>&1; then
        found_pids="$(fuser -n tcp "$port" 2>/dev/null | tr ' ' '\n' | sort -u || true)"
    else
        fail "Cannot free port ${port} automatically because neither lsof nor fuser is available."
    fi

    if [[ -z "$found_pids" ]]; then
        cleanup_stale_backend_pid
        return
    fi

    log "Port ${port} is in use. Stopping existing process..."

    while IFS= read -r pid; do
        [[ -z "$pid" ]] && continue

        pkill -TERM -P "$pid" >/dev/null 2>&1 || true
        kill -TERM "$pid" >/dev/null 2>&1 || true
    done <<< "$found_pids"

    sleep 2

    while IFS= read -r pid; do
        [[ -z "$pid" ]] && continue

        if kill -0 "$pid" >/dev/null 2>&1; then
            pkill -KILL -P "$pid" >/dev/null 2>&1 || true
            kill -KILL "$pid" >/dev/null 2>&1 || true
        fi
    done <<< "$found_pids"

    local elapsed=0
    while port_in_use "$port" && (( elapsed < 10 )); do
        sleep 1
        elapsed=$((elapsed + 1))
    done

    if port_in_use "$port"; then
        fail "Port ${port} is still in use after attempting cleanup."
    fi

    cleanup_stale_backend_pid
    log "Existing process stopped."
    log "Continuing Roomify startup..."
}

repair_demo_database() {
    log "Repairing local demo database compatibility..."

    local repair_sql
    read -r -d '' repair_sql <<'SQL' || true
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'audit_logs'
              AND column_name = 'created_at'
        ) THEN
            UPDATE audit_logs
            SET created_at = CURRENT_TIMESTAMP
            WHERE created_at IS NULL;

            ALTER TABLE audit_logs
                ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE audit_logs
                ALTER COLUMN created_at SET NOT NULL;
        ELSE
            ALTER TABLE audit_logs
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'audit_logs'
              AND column_name = 'timestamp'
        ) THEN
            UPDATE audit_logs
            SET "timestamp" = COALESCE("timestamp", created_at, CURRENT_TIMESTAMP)
            WHERE "timestamp" IS NULL;

            ALTER TABLE audit_logs
                ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE audit_logs
                ALTER COLUMN "timestamp" DROP NOT NULL;
        END IF;
    END IF;
END $$;
SQL

    if ! docker exec roomify-postgres psql -U roomify_user -d roomify -v ON_ERROR_STOP=1 -c "$repair_sql"; then
        fail "Local demo database repair failed. Check Docker/Postgres and retry."
    fi

    log "Local demo database compatibility is ready."
}

ensure_demo_infrastructure() {
    if tcp_ready "127.0.0.1" "$DB_PORT" \
        && tcp_ready "127.0.0.1" "$MAILPIT_SMTP_PORT" \
        && tcp_ready "127.0.0.1" "$MAILPIT_HTTP_PORT"; then
        log "Demo infrastructure is already reachable."
        return
    fi

    log "Starting demo infrastructure with docker compose..."
    if ! (cd "$REPO_ROOT" && docker compose up -d postgres mailpit); then
        fail "docker compose up failed. Check Docker and whether ports 5433, 1025, or 8025 are already in use."
    fi
}

# Launch the FastAPI AI finance service (port 8000) in the background.
# Independent of the DB/backend. Never fatal: on any failure it warns and
# returns so the rest of the stack still comes up (Spring Boot has a safe
# fallback when the AI service is unreachable).
start_ai_service() {
    if [[ ! -d "$AI_SERVICE_DIR" ]]; then
        warn "ai-service folder not found at ${AI_SERVICE_DIR}; skipping AI service (Spring Boot fallback still works)."
        AI_SERVICE_STATUS="missing ai-service folder"
        return
    fi

    if curl -fsS --max-time 2 "$AI_SERVICE_HEALTH_URL" >/dev/null 2>&1; then
        log "AI service already running on port ${AI_SERVICE_PORT}."
        AI_SERVICE_STATUS="already running"
        return
    fi

    local venv_python="$AI_SERVICE_DIR/.venv/bin/python"
    local requirements="$AI_SERVICE_DIR/requirements.txt"

    # Create the venv on a fresh clone; reuse it if already present.
    if [[ ! -x "$venv_python" ]]; then
        local python_bin=""
        if command -v python3 >/dev/null 2>&1; then
            python_bin="python3"
        elif command -v python >/dev/null 2>&1; then
            python_bin="python"
        else
            warn "Python 3 not found; skipping AI service (Spring Boot fallback still works)."
            AI_SERVICE_STATUS="python missing"
            return
        fi

        log "Creating AI service virtualenv at ${AI_SERVICE_DIR}/.venv ..."
        if ! ( cd "$AI_SERVICE_DIR" && "$python_bin" -m venv .venv ); then
            warn "Failed to create ai-service/.venv; skipping AI service (Spring Boot fallback still works)."
            AI_SERVICE_STATUS="venv creation failed"
            return
        fi
    fi

    if [[ ! -x "$venv_python" ]]; then
        warn "ai-service/.venv/bin/python missing after venv creation; skipping AI service."
        AI_SERVICE_STATUS="venv python missing"
        return
    fi

    # Install pinned deps only when they are not already importable.
    if ! "$venv_python" -c "import fastapi, uvicorn, pandas, sklearn, joblib, pydantic, requests, numpy" >/dev/null 2>&1; then
        if [[ ! -f "$requirements" ]]; then
            warn "ai-service/requirements.txt missing; skipping AI service."
            AI_SERVICE_STATUS="requirements missing"
            return
        fi
        log "Installing AI service Python requirements (first run)..."
        if ! ( cd "$AI_SERVICE_DIR" && "$venv_python" -m pip install -r requirements.txt ); then
            warn "AI service dependency install failed; skipping AI service (Spring Boot fallback still works)."
            AI_SERVICE_STATUS="requirements install failed"
            return
        fi
    fi

    : >"$AI_SERVICE_LOG"
    (
        cd "$AI_SERVICE_DIR" || exit 1
        nohup "$venv_python" -m uvicorn main:app --port "$AI_SERVICE_PORT" >>"$AI_SERVICE_LOG" 2>&1 &
        echo $! >"$AI_SERVICE_PID_FILE"
    )

    if [[ ! -f "$AI_SERVICE_PID_FILE" ]]; then
        warn "Could not capture AI service PID; it may not have started (Spring Boot fallback still works)."
        AI_SERVICE_STATUS="startup failed"
        return
    fi

    local elapsed=0
    while (( elapsed < 10 )); do
        if curl -fsS --max-time 2 "$AI_SERVICE_HEALTH_URL" >/dev/null 2>&1; then
            AI_SERVICE_STATUS="ready"
            return
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done

    warn "AI service did not answer ${AI_SERVICE_HEALTH_URL} yet; check ${AI_SERVICE_LOG} (Spring Boot fallback still works)."
    AI_SERVICE_STATUS="health not ready"
}

start_backend() {
    cleanup_stale_backend_pid
    : >"$BACKEND_LOG"

    (
        cd "$BACKEND_DIR" || exit 1
        nohup env DB_PORT="$DB_PORT" ROOMIFY_DEMO_BOOTSTRAP_ENABLED="true" ROOMIFY_AI_FINANCE_DEMO_SEED_ENABLED="false" \
            SPRING_MAIL_HOST="127.0.0.1" \
            SPRING_MAIL_PORT="1025" \
            SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH="false" \
            SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE="false" \
            ROOMIFY_MAIL_FROM="no-reply@roomify.local" \
            SPRING_JPA_HIBERNATE_DDL_AUTO="update" \
            sh ./mvnw spring-boot:run >>"$BACKEND_LOG" 2>&1 &
        echo $! >"$BACKEND_PID_FILE"
    )

    assert_file "$BACKEND_PID_FILE" "Failed to capture the backend PID."
    BACKEND_PID="$(cat "$BACKEND_PID_FILE")"

    if [[ -z "$BACKEND_PID" ]] || ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
        tail_backend_log
        fail "Backend failed to start. See ${BACKEND_LOG}."
    fi
}

start_frontend() {
    cleanup_stale_frontend_pid
    : >"$FRONTEND_LOG"

    (
        cd "$FRONTEND_DIR" || exit 1
        nohup npm run dev -- --host 127.0.0.1 >>"$FRONTEND_LOG" 2>&1 &
        echo $! >"$FRONTEND_PID_FILE"
    )

    assert_file "$FRONTEND_PID_FILE" "Failed to capture the frontend PID."
    FRONTEND_PID="$(cat "$FRONTEND_PID_FILE")"

    if [[ -z "$FRONTEND_PID" ]] || ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
        log ""
        log "Last frontend log lines:"
        tail -n 40 "$FRONTEND_LOG" 2>/dev/null || true
        fail "Frontend failed to start. See ${FRONTEND_LOG}."
    fi
}

wait_for_backend() {
    local timeout_seconds=120
    local elapsed=0

    while (( elapsed < timeout_seconds )); do
        if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
            tail_backend_log
            stop_backend_process "$BACKEND_PID"
            fail "Backend process exited before it became ready."
        fi

        local health_body
        health_body="$(curl -fsS --max-time 2 "$BACKEND_HEALTH_URL" 2>/dev/null || true)"
        if [[ "$health_body" == *'"status":"ok"'* ]]; then
            return 0
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    tail_backend_log
    stop_backend_process "$BACKEND_PID"
    fail "Backend did not become ready at ${BACKEND_HEALTH_URL} within ${timeout_seconds}s."
}

wait_for_frontend() {
    local timeout_seconds=60
    local elapsed=0

    while (( elapsed < timeout_seconds )); do
        if ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
            log ""
            log "Last frontend log lines:"
            tail -n 40 "$FRONTEND_LOG" 2>/dev/null || true
            stop_frontend_process "$FRONTEND_PID"
            fail "Frontend process exited before it became ready."
        fi

        if tcp_ready "127.0.0.1" "$FRONTEND_PORT"; then
            return 0
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    log ""
    log "Last frontend log lines:"
    tail -n 40 "$FRONTEND_LOG" 2>/dev/null || true
    stop_frontend_process "$FRONTEND_PID"
    fail "Frontend did not become reachable on 127.0.0.1:${FRONTEND_PORT} within ${timeout_seconds}s."
}

print_summary() {
    log ""
    log "Ready checklist"
    log "- Postgres: ready"
    log "- Mailpit: ready"
    log "- Backend: ready"
    log "- AI Finance service: ${AI_SERVICE_STATUS} (${AI_SERVICE_HEALTH_URL})"
    log "- Frontend: ready"
    log "- App: ${APP_URL}"
    log "- Login: ${LOGIN_URL}"
    log "- Mail inbox: ${MAILPIT_URL}"
    log "- Demo access: ${DEMO_ACCESS_NOTE}"
    log "- Backend log: ${BACKEND_LOG}"
    log "- Backend PID file: ${BACKEND_PID_FILE}"
    log "- Frontend log: ${FRONTEND_LOG}"
    log "- Frontend PID file: ${FRONTEND_PID_FILE}"
}

main() {
    require_command docker "Docker is required but was not found in PATH."
    require_command curl "curl is required but was not found in PATH."
    require_command npm "npm is required but was not found in PATH."
    assert_file "$REPO_ROOT/docker-compose.yml" "docker-compose.yml was not found in ${REPO_ROOT}."
    assert_file "$BACKEND_DIR/mvnw" "The backend Maven wrapper is missing at ${BACKEND_DIR}/mvnw."
    assert_file "$FRONTEND_DIR/package.json" "frontend/package.json is missing at ${FRONTEND_DIR}/package.json."

    if [[ -f "$FRONTEND_DIR/.env.example" && ! -f "$FRONTEND_DIR/.env" ]]; then
        log "Creating frontend/.env from .env.example..."
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    fi

    if ! docker compose version >/dev/null 2>&1; then
        fail "Docker Compose v2 is required. Run 'docker compose version' after Docker Desktop is up."
    fi

    ensure_demo_infrastructure

    log "Waiting for Postgres on 127.0.0.1:${DB_PORT}..."
    wait_for_tcp "Postgres" "127.0.0.1" "$DB_PORT" 60
    log "Postgres is ready."

    log "Waiting for Mailpit SMTP on 127.0.0.1:${MAILPIT_SMTP_PORT}..."
    wait_for_tcp "Mailpit SMTP" "127.0.0.1" "$MAILPIT_SMTP_PORT" 60

    log "Waiting for Mailpit UI on 127.0.0.1:${MAILPIT_HTTP_PORT}..."
    wait_for_tcp "Mailpit UI" "127.0.0.1" "$MAILPIT_HTTP_PORT" 60
    log "Mailpit is ready."

    repair_demo_database

    stop_processes_on_port "$BACKEND_PORT"
    stop_processes_on_port "$FRONTEND_PORT"

    log "Starting backend with DB_PORT=${DB_PORT}, ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true, and local schema update enabled..."
    start_backend

    log "Waiting for backend health at ${BACKEND_HEALTH_URL}..."
    wait_for_backend
    log "Backend is ready."

    log "Starting AI Finance service on port ${AI_SERVICE_PORT}..."
    start_ai_service

    log "Starting frontend on ${APP_URL}..."
    start_frontend

    log "Waiting for frontend on 127.0.0.1:${FRONTEND_PORT}..."
    wait_for_frontend
    log "Frontend is ready."

    print_summary
}

main "$@"
