from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import requests

from model import DATA_DIR, normalize_training_frame, train_and_save_models

DEFAULT_API_URL = "http://localhost:8080/api/ai-finance/training-data?start=2025-01-01&end=2026-04-27"
DEFAULT_CSV_PATH = DATA_DIR / "training_data.csv"


def load_training_frame(api_url: str = DEFAULT_API_URL, csv_path: Path = DEFAULT_CSV_PATH) -> pd.DataFrame:
    api_error: str | None = None
    try:
        print(f"Trying Spring Boot training-data API: {api_url}")
        response = requests.get(api_url, timeout=30)
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
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"Training failed: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
