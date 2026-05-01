# AI Finance Demo Rehearsal Checklist

Actual rehearsal could not be performed in this Codex environment. Use this checklist during the final local demo prep.

## Rehearsal 1: FastAPI ON

1. Start PostgreSQL, Spring Boot, FastAPI, and the React dev server.
2. Login as Manager.
3. Open `/manager/ai-finance`.
4. Confirm `/api/ai-finance/health` reports `UP`.
5. Confirm model info, forecast, pricing recommendations, and all four insight buttons work.
6. Confirm no fallback banner is shown for live model responses.
7. Confirm no fatal console errors.

## Rehearsal 2: FastAPI OFF / fallback mode

1. Keep Spring Boot and React running.
2. Stop only FastAPI.
3. Refresh `/manager/ai-finance`.
4. Confirm Spring Boot still responds.
5. Confirm forecast and pricing sections show `SAFE_DEMO_FALLBACK` messaging.
6. Click the revenue forecast insight button and confirm fallback response is displayed honestly.
7. Restart FastAPI and confirm health returns to `UP`.

## Rehearsal 3: fresh browser session

1. Open a fresh browser session or clear application storage.
2. Confirm unauthenticated access to `/manager/ai-finance` is blocked.
3. Login as Manager.
4. Confirm Manager AI Finance navigation appears.
5. Confirm Staff and Guest users do not see the AI Finance navigation if those users are provisioned.
6. Run the supervisor demo script once without using developer tools.
