# How to Run Roomify

## Recommended Path

Use the platform startup script first. It is the recommended way to start the repeatable local demo backend stack.

- macOS: `./start-roomify-mac.sh`
- Windows PowerShell: `.\start-roomify-windows.ps1`

For Google Places hotel discovery, keep the real key in a local uncommitted root file:

```powershell
Copy-Item .\.env.local.example .\.env.local
notepad .\.env.local
```

Use placeholder-free local values only in `.env.local`:

```dotenv
GOOGLE_PLACES_API_KEY=your_key_here
GOOGLE_MAPS_DEMO_KEY_MODE=true
```

The startup scripts load `.env` first and `.env.local` second, so `.env.local` can override local backend-only settings without exposing them to the frontend.

Each script does all of the following:
- Starts `postgres` and `mailpit` with `docker compose`
- Waits for PostgreSQL, Mailpit SMTP, and Mailpit UI
- Frees backend port `8080` automatically if another local process is already listening there
- Starts the backend with `DB_PORT=5433` and `ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true`
- Waits for backend health at `http://127.0.0.1:8080/api/health`
- Windows PowerShell starts the frontend on `http://localhost:3000`
- Prints the ready checklist, logs, and PID files

## Prerequisites
- Docker Desktop must be open and running
- Demo mail UI: `http://127.0.0.1:8025`
- Demo SMTP sink: `127.0.0.1:1025`

---

## Steps

### 1. Start the Backend Demo Stack

```bash
# macOS / Linux
cd ~/roomify-hotel-management
./start-roomify-mac.sh
```

```powershell
# Windows (PowerShell)
cd $env:USERPROFILE\roomify-hotel-management
.\start-roomify-windows.ps1
```

The script starts and verifies:
- PostgreSQL on `127.0.0.1:5433`
- SMTP: `127.0.0.1:1025`
- Web UI: `http://127.0.0.1:8025`

The demo bootstrap resets these reservations on each backend start:
- `RFY-ARRIVAL-TODAY`
- `RFY-ARRIVAL-BLOCKED`
- `RFY-CANCEL-REVIEW`
- `RFY-MODIFY-STAY`
- `RFY-MODIFY-CONFLICT`
- `RFY-GUEST-UPCOMING`

---

### 2. Open the App

[http://localhost:3000](http://localhost:3000)

Demo password shortcuts are disabled. Use the seeded real admin credentials for this environment.

Quick smoke:
- Open `/search` and run the default same-day search (`today -> tomorrow`)
- Expect demo rooms such as `D102`, `D201`, `D202`, `D301`, `D302`
- Open Mailpit at [http://127.0.0.1:8025](http://127.0.0.1:8025) for email-dependent flows

---

## Stopping Everything

- **Frontend Windows PowerShell:**
  ```powershell
  Stop-Process -Id (Get-Content .\frontend\demo-frontend.pid)
  ```
- **Backend macOS / Linux:**
  ```bash
  kill "$(cat backend/demo-backend.pid)"
  ```
- **Backend Windows PowerShell:**
  ```powershell
  Stop-Process -Id (Get-Content .\backend\demo-backend.pid)
  ```
- **Infra:**
  ```bash
  docker compose stop postgres mailpit
  ```

---

## Troubleshooting

### Port already in use

The scripts now try to stop any existing listener on port `8080` automatically before starting Roomify. This is aggressive and intended for local demo use.

### Backend won't start — "Unable to determine Dialect"
The database isn't running. Make sure Docker Desktop is open and rerun the startup script.
