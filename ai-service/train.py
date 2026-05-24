from __future__ import annotations

import os
import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests

from model import DATA_DIR, normalize_training_frame, train_and_save_models


def _normalized_base_url(value: str | None) -> str:
    return (value or "").strip().rstrip("/")


def _resolve_backend_base_url() -> str:
    direct_url = _normalized_base_url(os.getenv("ROOMIFY_BACKEND_URL"))
    if (direct_url):
        return direct_url

    host = _normalized_base_url(os.getenv("ROOMIFY_BACKEND_HOST"))
    port = (os.getenv("ROOMIFY_BACKEND_PORT") or "").strip()
    if host and port:
        return f"http://{host}:{port}"

    return ""


def _build_default_api_url() -> str:
    """Build the training-data URL relative to today so the demo never goes stale.

    Spans the past 730 days (2 years of seeded history) through today, matching
    the window that DemoDataBootstrap seeds.
    """
    backend_base_url = _resolve_backend_base_url()
    if not backend_base_url:
        return ""

    end = date.today()
    start = end - timedelta(days=730)
    return (
        f"{backend_base_url}/api/ai-finance/training-data"
        f"?start={start.isoformat()}&end={end.isoformat()}"
    )


DEFAULT_API_URL = os.getenv("ROOMIFY_TRAINING_API_URL", _build_default_api_url()).strip()
DEFAULT_CSV_PATH = DATA_DIR / "training_data.csv"


DEFAULT_LOGIN_URL = os.getenv(
    "ROOMIFY_TRAINING_LOGIN_URL",
    f"{_resolve_backend_base_url()}/api/auth/login" if _resolve_backend_base_url() else "",
).strip()
DEFAULT_TRAIN_EMAIL = os.getenv("ROOMIFY_TRAINING_EMAIL", "manager@roomify.com").strip()
DEFAULT_TRAIN_PASSWORD = os.getenv("ROOMIFY_TRAINING_PASSWORD", "password123").strip()


def _fetch_bearer_token(login_url: str = DEFAULT_LOGIN_URL,
                        email: str = DEFAULT_TRAIN_EMAIL,
                        password: str = DEFAULT_TRAIN_PASSWORD) -> str | None:
    """Acquire a Bearer token from the backend so training-data calls authorise.

    The /api/ai-finance/training-data endpoint requires MANAGER/ADMIN auth;
    the seeded manager account is the default. Returns None on failure so the
    caller falls back to the cached CSV path.
    """
    if not login_url:
        return None

    try:
        response = requests.post(
            login_url,
            json={"email": email, "password": password},
            timeout=10,
        )
        response.raise_for_status()
        return response.json().get("token")
    except Exception as exc:  # noqa: BLE001
        print(f"Token fetch failed: {exc}")
        return None


def load_training_frame(api_url: str = DEFAULT_API_URL, csv_path: Path = DEFAULT_CSV_PATH) -> pd.DataFrame:
    api_error: str | None = None
    if api_url:
        try:
            print(f"Trying Spring Boot training-data API: {api_url}")
            token = _fetch_bearer_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            response = requests.get(api_url, headers=headers, timeout=30)
            response.raise_for_status()
            payload = response.json()
            frame = pd.DataFrame(payload)
            if frame.empty:
                raise ValueError("API returned an empty training dataset")
            csv_path.parent.mkdir(parents=True, exist_ok=True)
            frame.to_csv(csv_path, index=False)
            print(f"Loaded {len(frame)} rows from API and cached CSV at {csv_path}")
            return frame
        except Exception as exc:  # noqa: BLE001
            api_error = str(exc)
            print(f"API load failed: {api_error}")
    else:
        api_error = "ROOMIFY_BACKEND_URL or ROOMIFY_TRAINING_API_URL is not configured"
        print(f"API load skipped: {api_error}")

    if csv_path.exists():
        print(f"Falling back to local CSV: {csv_path}")
        frame = pd.read_csv(csv_path)
        if frame.empty:
            raise RuntimeError(
                f"Local CSV exists but is empty: {csv_path}. API error was: {api_error}"
            )
        print(f"Loaded {len(frame)} rows from local CSV")
        return frame

    raise RuntimeError(
        "Unable to load training data. API failed and local CSV fallback is missing. "
        f"API error: {api_error}"
    )


def main() -> int:
    try:
        raw_frame = load_training_frame()
        normalized = normalize_training_frame(raw_frame)
        print(f"Normalized training row count: {len(normalized)}")
        metadata = train_and_save_models(normalized)
        print("Training completed successfully.")
        print(f"trainingRows={metadata['trainingRows']}")
        print(f"revenueMae={metadata['revenueMae']}")
        print(f"occupancyMae={metadata['occupancyMae']}")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"Training failed: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
