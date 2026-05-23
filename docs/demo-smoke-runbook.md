# Demo Smoke Runbook

Use this runbook for the repeatable local demo path. It assumes the repo is running on the local machine and uses the built-in demo bootstrap.

## Prerequisites

- Docker Desktop running
- Backend started through the platform startup script
- Frontend started manually with `npm run dev`

## Default local endpoints

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/health`
- Mailpit UI: `http://127.0.0.1:8025`
- Mailpit SMTP: `127.0.0.1:1025`

## Startup order

1. Start backend demo stack:
   - macOS: `./start-roomify-mac.sh`
   - Windows PowerShell: `.\start-roomify-windows.ps1`
   - the script will stop any current listener on port `8080` before starting Roomify
2. Confirm the script prints:
   - `Postgres: ready`
   - `Mailpit: ready`
   - `Backend: ready`
3. Start frontend manually:
   - macOS / Linux: `cd frontend && npm run dev`
   - Windows PowerShell: `Set-Location .\frontend; npm run dev`
4. Confirm backend health returns `{"status":"ok",...}`

## Demo fixtures reset on backend start

- `DEMO-CHECKIN-READY`
- `DEMO-CHECKIN-BLOCKED`
- `DEMO-CANCEL`
- `DEMO-MODIFY`
- `DEMO-MODIFY-CONFLICT`

Demo rooms kept stable for room search:

- `D101`
- `D102`
- `D201`
- `D202`
- `D301`
- `D302`

## Browser smoke path

1. Open `http://localhost:3000/login`
2. Sign in with the seeded real admin credentials for this environment
3. Open `/search`
4. Keep the default dates (`today` to `tomorrow`) and run search
5. Confirm same-day availability returns demo rooms, including `D102`, `D201`, `D202`, `D301`, and `D302`
6. Open `/reservations/cancel`
7. Search `DEMO-CANCEL` and cancel it with an optional reason
8. Open Mailpit and confirm a `Reservation Cancelled` message appears

## Optional follow-up demo checks

- Check-in success: `/check-in` with `DEMO-CHECKIN-READY`
- Check-in blocked before arrival: `/check-in` with `DEMO-CHECKIN-BLOCKED`
- Modify flow with recalculation: `/reservations/modify` with `DEMO-MODIFY`

## Notes

- Restarting the backend resets the demo fixtures above.
- Mail delivery is local-only through Mailpit; no external SMTP account is required.
- The startup scripts are the recommended path for local demo backend setup.
