from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

try:
    from xgboost import XGBRegressor
except ImportError:  # pragma: no cover - optional dependency
    XGBRegressor = None


PRICE_DELTAS = [-0.20, -0.15, -0.10, -0.05, 0.0, 0.05, 0.10, 0.15, 0.20]
ELASTICITY_FEATURES = [
    "roomType",
    "month",
    "dayOfWeek",
    "season",
    "weekend",
    "currentOccupancy",
    "currentBookings",
    "cancellations",
    "currentPrice",
    "simulatedPrice",
    "priceDeltaPercentage",
]


@dataclass
class ElasticityModelBundle:
    model: Any
    model_type: str
    training_rows: int


def build_elasticity_model(reference_data: pd.DataFrame) -> ElasticityModelBundle:
    training_frame = build_elasticity_training_frame(reference_data)
    if training_frame.empty:
        raise ValueError("reference data is empty after elasticity feature engineering")

    model_type = "XGBoostRegressor" if XGBRegressor is not None else "RandomForestRegressor"
    pipeline = _build_pipeline(model_type)
    pipeline.fit(training_frame[ELASTICITY_FEATURES], training_frame["targetOccupancy"])
    return ElasticityModelBundle(
        model=pipeline,
        model_type=model_type,
        training_rows=int(len(training_frame)),
    )


def build_elasticity_training_frame(reference_data: pd.DataFrame) -> pd.DataFrame:
    frame = reference_data.copy()
    if frame.empty:
        return frame

    frame["season"] = frame["month"].apply(_season_for_month)
    frame["weekend"] = frame["weekend"].astype(bool)
    frame["dayOfWeek"] = pd.to_numeric(frame["dayOfWeek"], errors="coerce").fillna(1).astype(int)

    synthetic_rows: list[dict[str, Any]] = []
    for row in frame.to_dict("records"):
        for delta in PRICE_DELTAS:
            simulated_price = float(row["averageRoomPrice"]) * (1.0 + delta)
            target_occupancy = _simulate_historical_occupancy(row, delta)
            synthetic_rows.append(
                {
                    "roomType": str(row["roomType"]),
                    "month": int(row["month"]),
                    "dayOfWeek": int(row["dayOfWeek"]),
                    "season": _season_for_month(int(row["month"])),
                    "weekend": bool(row["weekend"]),
                    "currentOccupancy": float(row["occupancyRate"]),
                    "currentBookings": int(row["confirmedBookings"]),
                    "cancellations": int(row["cancelledBookings"]),
                    "currentPrice": round(float(row["averageRoomPrice"]), 2),
                    "simulatedPrice": round(float(simulated_price), 2),
                    "priceDeltaPercentage": round(delta * 100.0, 2),
                    "targetOccupancy": round(target_occupancy, 4),
                }
            )

    return pd.DataFrame(synthetic_rows)


def predict_occupancy(
    model_bundle: ElasticityModelBundle,
    feature_frame: pd.DataFrame,
) -> np.ndarray:
    predictions = model_bundle.model.predict(feature_frame[ELASTICITY_FEATURES])
    return np.clip(predictions, 5.0, 98.0)


def _build_pipeline(model_type: str) -> Pipeline:
    categorical_features = ["roomType", "season"]
    numeric_features = [feature for feature in ELASTICITY_FEATURES if feature not in categorical_features]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
                numeric_features,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
        ]
    )

    if model_type == "XGBoostRegressor" and XGBRegressor is not None:
        regressor: Any = XGBRegressor(
            n_estimators=220,
            max_depth=5,
            learning_rate=0.055,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=42,
        )
    else:
        regressor = RandomForestRegressor(
            n_estimators=260,
            random_state=42,
            min_samples_leaf=2,
        )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", regressor),
        ]
    )


def _simulate_historical_occupancy(row: dict[str, Any], delta: float) -> float:
    baseline_occupancy = float(row["occupancyRate"])
    bookings = max(float(row["confirmedBookings"]), 1.0)
    cancellations = max(float(row["cancelledBookings"]), 0.0)
    cancellation_pressure = min(0.35, cancellations / bookings)
    weekend_boost = 1.04 if bool(row["weekend"]) else 1.0
    season_boost = _seasonal_demand_multiplier(int(row["month"]))
    sensitivity = _room_type_sensitivity(str(row["roomType"]))

    if delta < 0:
        elasticity_multiplier = 1.0 + abs(delta) * sensitivity * (1.15 + (1.0 - baseline_occupancy / 100.0))
    else:
        elasticity_multiplier = 1.0 - delta * sensitivity * (0.92 + (baseline_occupancy / 100.0))

    adjusted = baseline_occupancy * elasticity_multiplier
    adjusted *= weekend_boost * season_boost * (1.0 - cancellation_pressure * 0.28)
    adjusted += _seasonal_bias_points(int(row["month"]))
    if bool(row["weekend"]):
        adjusted += 1.4

    return float(np.clip(adjusted, 5.0, 98.0))


def _room_type_sensitivity(room_type: str) -> float:
    normalized = room_type.strip().lower()
    return {
        "standard": 0.82,
        "deluxe": 0.74,
        "family": 0.66,
        "executive": 0.58,
        "suite": 0.52,
    }.get(normalized, 0.68)


def _season_for_month(month: int) -> str:
    if month in {12, 1, 2}:
        return "winter"
    if month in {3, 4, 5}:
        return "spring"
    if month in {6, 7, 8}:
        return "summer"
    return "autumn"


def _seasonal_demand_multiplier(month: int) -> float:
    if month in {7, 8, 12, 1, 2}:
        return 1.05
    if month in {6, 9}:
        return 0.94
    if month in {10, 11}:
        return 1.02
    return 1.0


def _seasonal_bias_points(month: int) -> float:
    if month in {7, 8, 12, 1, 2}:
        return 1.6
    if month in {6, 9}:
        return -1.2
    if month in {10, 11}:
        return 0.8
    return 0.0
