from __future__ import annotations

import os
import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests

from model import DATA_DIR, normalize_training_frame, train_and_save_models


def _build_default_api_url() -> str:
    """Build the training-data URL relative to today so the demo never goes stale.

    Spans the past 730 days (2 years of seeded history) through today, matching
    the window that DemoDataBootstrap seeds.
    """
    end = date.today()
    start = end - timedelta(days=730)
    return f"http://localhost:8080/api/ai-finance/training-data?start={start.isoformat()}&end={end.isoformat()}"


DEFAULT_API_URL = _build_default_api_url()
DEFAULT_CSV_PATH = DATA_DIR / "training_data.csv"


DEFAULT_LOGIN_URL = os.getenv("ROOMIFY_TRAIN_LOGIN_URL", "http://localhost:8080/api/auth/login")
DEFAULT_TRAIN_EMAIL = os.getenv("ROOMIFY_TRAIN_EMAIL")
DEFAULT_TRAIN_PASSWORD = os.getenv("ROOMIFY_TRAIN_PASSWORD")


def _fetch_bearer_token(login_url: str = DEFAULT_LOGIN_URL,
                        email: str | None = DEFAULT_TRAIN_EMAIL,
                        password: str | None = DEFAULT_TRAIN_PASSWORD) -> str | None:
    """Acquire a Bearer token from the backend so training-data calls authorise.

    The /api/ai-finance/training-data endpoint requires MANAGER/ADMIN auth;
    credentials are supplied through environment variables. Returns None when
    credentials are absent or authentication fails so the caller can use CSV.
    """
    if not email or not password:
        print("Training API credentials are not configured; using CSV fallback if available.")
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
        print(f"evaluationStrategy={metadata['evaluationStrategy']}")
        print(f"revenueEvaluation={metadata['evaluation']['revenue']}")
        print(f"occupancyEvaluation={metadata['evaluation']['occupancy']}")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"Training failed: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
