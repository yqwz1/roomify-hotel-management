# How to Run Roomify

## Prerequisites
- **Docker Desktop** must be open and running
- Run each step in a **separate terminal tab/window**

---

## Steps

### 1. Start the Database

```bash
# macOS / Linux
cd ~/roomify-hotel-management
docker compose up -d postgres
```

```powershell
# Windows (PowerShell)
cd $env:USERPROFILE\roomify-hotel-management
docker compose up -d postgres
```

*Only needed once per Docker session.*

---

### 2. Start the Backend

**macOS / Linux:**
```bash
cd ~/roomify-hotel-management/backend
DB_PORT=5433 ./mvnw spring-boot:run
```

**Windows (PowerShell):**
```powershell
cd $env:USERPROFILE\roomify-hotel-management\backend
$env:DB_PORT="5433"
./mvnw spring-boot:run
```

Wait for: `Started RoomifyBackendApplication` (~5–10s)

> [!IMPORTANT]
> Press **Ctrl+C** to stop — don't just close the window.

---

### 3. Start the Frontend

```bash
# macOS / Linux / Windows
cd roomify-hotel-management/frontend
npm run dev
```

> [!IMPORTANT]
> Always run in a real terminal tab — never as a background job (`&`), as Vite will suspend itself and stop responding.

---

### 4. Open the App

[http://localhost:3000](http://localhost:3000)

Login: `admin@roomify.com` / `password123`

---

## Stopping Everything

- **Frontend & Backend:** `Ctrl+C` in each terminal
- **Database:**
  ```bash
  docker compose stop postgres
  ```

---

## Troubleshooting

### Port already in use

**macOS / Linux:**
```bash
lsof -ti:8080 | xargs kill -9   # backend
lsof -ti:3000 | xargs kill -9   # frontend
```

**Windows (PowerShell):**
```powershell
# Replace 8080 with 3000 for frontend
$p = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($p) { Stop-Process -Id $p.OwningProcess -Force }
```

### Backend won't start — "Unable to determine Dialect"
The database isn't running. Make sure Docker Desktop is open and repeat Step 1.
