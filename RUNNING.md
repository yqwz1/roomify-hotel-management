# How to Run Roomify

## Recommended Path

Use the platform startup script first. It is the recommended way to start the repeatable local demo backend stack.

- macOS: `./start-roomify-mac.sh`
- Windows PowerShell: `.\start-roomify-windows.ps1`

Each script does all of the following:
- Starts `postgres` and `mailpit` with `docker compose`
- Waits for PostgreSQL, Mailpit SMTP, and Mailpit UI
- Frees backend port `8080` automatically if another local process is already listening there
- Starts the backend with `DB_PORT=5433` and `ROOMIFY_DEMO_BOOTSTRAP_ENABLED=true`
- Waits for backend health at `http://127.0.0.1:8080/api/health`
- Prints the ready checklist and the exact manual frontend command

## Prerequisites
- Docker Desktop must be open and running
- Run the frontend in a separate terminal after the script reports `Backend: ready`
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
- `DEMO-CHECKIN-READY`
- `DEMO-CHECKIN-BLOCKED`
- `DEMO-CANCEL`
- `DEMO-MODIFY`
- `DEMO-MODIFY-CONFLICT`

---

### 2. Start the Frontend Manually

```bash
# macOS / Linux
cd roomify-hotel-management/frontend
npm run dev
```

```powershell
# Windows PowerShell
Set-Location "$env:USERPROFILE\roomify-hotel-management\frontend"
npm run dev
```

> [!IMPORTANT]
> The startup scripts intentionally leave the frontend manual. Run it in a real terminal tab — never as a background job (`&`), as Vite will suspend itself and stop responding.

---

### 3. Open the App

[http://localhost:3000](http://localhost:3000)

Login: `admin@roomify.com` / `password123`

Quick smoke:
- Open `/search` and run the default same-day search (`today -> tomorrow`)
- Expect demo rooms such as `D102`, `D201`, `D202`, `D301`, `D302`
- Open Mailpit at [http://127.0.0.1:8025](http://127.0.0.1:8025) for email-dependent flows

---

## Stopping Everything

- **Frontend:** `Ctrl+C` in the frontend terminal
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
