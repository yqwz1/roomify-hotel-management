# How to Run Roomify

Follow these 3 steps every time you want to start the application.

## 1. Start the Database (Docker)
Ensure Docker Desktop is open, then run:
```bash
docker-compose up -d
```
*You only need to do this once per session.*

## 2. Start the Backend
Open a terminal, navigate to the `backend` folder, and run:
```bash
cd backend
./mvnw spring-boot:run
```
*Wait for "Started RoomifyBackendApplication"*

> [!IMPORTANT]
> To stop the backend, press **Ctrl+C** in the terminal. Do not just close the window.

## 3. Start the Frontend
Open a **new** terminal window, navigate to the `frontend` folder, and run:
```bash
cd frontend
npm run dev
```

## 4. Access the App
Open your browser to: [http://localhost:5173](http://localhost:5173)

---

## Troubleshooting

### "Port 8080 was already in use"
If you see this error, it means the backend is already running in the background. Run this command to stop it:

```bash
lsof -ti:8080 | xargs kill -9
```
Then try running the backend again.
