from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
REVENUE_MODEL_PATH = MODELS_DIR / "revenue_model.joblib"
OCCUPANCY_MODEL_PATH = MODELS_DIR / "occupancy_model.joblib"
MODEL_METADATA_PATH = MODELS_DIR / "model_metadata.json"
REFERENCE_DATA_PATH = MODELS_DIR / "reference_data.csv"

MODEL_TYPE = "RandomForestRegressor"
MODEL_VERSION = "ai-finance-v1"
TARGET_REVENUE = "dailyRevenue"
TARGET_OCCUPANCY = "occupancyRate"
REVENUE_FEATURES = [
    "dayOfWeek",
    "month",
    "weekend",
    "roomType",
    "roomTypeId",
    "totalRooms",
    "occupiedRoomNights",
    "confirmedBookings",
    "cancelledBookings",
    "averageRoomPrice",
    "dailyExpenses",
    "occupancyRate",
]
OCCUPANCY_FEATURES = [
    "dayOfWeek",
    "month",
    "weekend",
    "roomType",
    "roomTypeId",
    "totalRooms",
    "confirmedBookings",
    "cancelledBookings",
    "averageRoomPrice",
    "dailyExpenses",
]
METADATA_FEATURES = REVENUE_FEATURES
TARGETS = [TARGET_REVENUE, TARGET_OCCUPANCY]
ROOM_TYPE_DISPLAY_NAMES = {
    "standard": "Classic King",
    "demo standard": "Classic King",
    "classic standard": "Classic King",
    "deluxe": "Deluxe King",
    "demo deluxe": "Deluxe Twin",
    "suite": "Olaya Suite",
    "demo suite": "Olaya Suite",
}


@dataclass
class ArtifactBundle:
    revenue_model: Any
    occupancy_model: Any
    metadata: dict[str, Any]
    reference_data: pd.DataFrame


def ensure_directories() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def normalize_training_frame(frame: pd.DataFrame) -> pd.DataFrame:
    normalized = frame.copy()
    normalized.columns = [str(column).strip() for column in normalized.columns]

    required_columns = {
        "date",
        "dayOfWeek",
        "month",
        "weekend",
        "roomType",
        "roomTypeId",
        "totalRooms",
        "occupiedRoomNights",
        "confirmedBookings",
        "cancelledBookings",
        "averageRoomPrice",
        "dailyRevenue",
        "dailyExpenses",
        "occupancyRate",
    }
    missing = required_columns.difference(normalized.columns)
    if missing:
        raise ValueError(f"training data is missing required columns: {sorted(missing)}")

    normalized["date"] = pd.to_datetime(normalized["date"], errors="coerce").dt.date
    normalized = normalized.dropna(subset=["date", "roomType"])

    numeric_columns = [
        "dayOfWeek",
        "month",
        "roomTypeId",
        "totalRooms",
        "occupiedRoomNights",
        "confirmedBookings",
        "cancelledBookings",
        "averageRoomPrice",
        "dailyRevenue",
        "dailyExpenses",
        "occupancyRate",
    ]
    for column in numeric_columns:
        normalized[column] = pd.to_numeric(normalized[column], errors="coerce")

    normalized["weekend"] = normalized["weekend"].apply(_to_bool)
    normalized["roomType"] = normalized["roomType"].astype(str).str.strip().apply(display_room_type_name)
    normalized["roomTypeId"] = normalized["roomTypeId"].fillna(-1).astype(int)
    normalized["dayOfWeek"] = normalized["dayOfWeek"].fillna(
        pd.to_datetime(normalized["date"]).dt.dayofweek + 1
    )
    normalized["month"] = normalized["month"].fillna(pd.to_datetime(normalized["date"]).dt.month)
    normalized["totalRooms"] = normalized["totalRooms"].fillna(0).astype(int)
    normalized["occupiedRoomNights"] = normalized["occupiedRoomNights"].fillna(0).astype(int)
    normalized["confirmedBookings"] = normalized["confirmedBookings"].fillna(0).astype(int)
    normalized["cancelledBookings"] = normalized["cancelledBookings"].fillna(0).astype(int)

    normalized["averageRoomPrice"] = normalized["averageRoomPrice"].fillna(
        normalized.groupby("roomType")["averageRoomPrice"].transform("median")
    )
    normalized["averageRoomPrice"] = normalized["averageRoomPrice"].fillna(
        normalized["averageRoomPrice"].median()
    )
    normalized["dailyExpenses"] = normalized["dailyExpenses"].fillna(0.0)
    normalized["dailyRevenue"] = normalized["dailyRevenue"].fillna(0.0)
    normalized["occupancyRate"] = normalized["occupancyRate"].fillna(0.0)

    normalized = normalized[normalized["totalRooms"] > 0].copy()
    normalized["dailyRevenue"] = normalized["dailyRevenue"].clip(lower=0.0)
    normalized["dailyExpenses"] = normalized["dailyExpenses"].clip(lower=0.0)
    normalized["cancelledBookings"] = normalized["cancelledBookings"].clip(lower=0)
    normalized["occupancyRate"] = normalized["occupancyRate"].clip(lower=0.0, upper=100.0)
    normalized["occupiedRoomNights"] = normalized["occupiedRoomNights"].clip(lower=0)

    normalized = normalized.sort_values(["date", "roomTypeId", "roomType"]).reset_index(drop=True)
    return normalized


def train_and_save_models(frame: pd.DataFrame) -> dict[str, Any]:
    ensure_directories()
    normalized = normalize_training_frame(frame)
    if normalized.empty:
        raise ValueError("training data is empty after normalization")

    revenue_model, revenue_mae = _fit_regressor(normalized, REVENUE_FEATURES, TARGET_REVENUE)
    occupancy_model, occupancy_mae = _fit_regressor(normalized, OCCUPANCY_FEATURES, TARGET_OCCUPANCY)

    joblib.dump(revenue_model, REVENUE_MODEL_PATH)
    joblib.dump(occupancy_model, OCCUPANCY_MODEL_PATH)
    normalized.to_csv(REFERENCE_DATA_PATH, index=False)

    metadata = {
        "modelType": MODEL_TYPE,
        "trainedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "trainingRows": int(len(normalized)),
        "revenueMae": round(float(revenue_mae), 4),
        "occupancyMae": round(float(occupancy_mae), 4),
        "features": METADATA_FEATURES,
        "targets": TARGETS,
        "trainingDateRange": {
            "start": str(normalized["date"].min()),
            "end": str(normalized["date"].max()),
        },
        "modelVersion": MODEL_VERSION,
    }
    MODEL_METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def load_artifacts() -> ArtifactBundle:
    missing = [
        path.name
        for path in [REVENUE_MODEL_PATH, OCCUPANCY_MODEL_PATH, MODEL_METADATA_PATH, REFERENCE_DATA_PATH]
        if not path.exists()
    ]
    if missing:
        raise FileNotFoundError(f"missing model artifacts: {', '.join(missing)}")

    revenue_model = joblib.load(REVENUE_MODEL_PATH)
    occupancy_model = joblib.load(OCCUPANCY_MODEL_PATH)
    metadata = json.loads(MODEL_METADATA_PATH.read_text(encoding="utf-8"))
    reference_data = normalize_training_frame(pd.read_csv(REFERENCE_DATA_PATH))
    return ArtifactBundle(revenue_model, occupancy_model, metadata, reference_data)


def load_model_metadata() -> dict[str, Any] | None:
    if not MODEL_METADATA_PATH.exists():
        return None
    return json.loads(MODEL_METADATA_PATH.read_text(encoding="utf-8"))


def generate_forecast(bundle: ArtifactBundle, forecast_days: int = 30) -> dict[str, Any]:
    if forecast_days <= 0:
        raise ValueError("forecast_days must be positive")

    future_frame = build_future_feature_frame(bundle.reference_data, forecast_days)
    occupancy_predictions = np.clip(
        bundle.occupancy_model.predict(future_frame[OCCUPANCY_FEATURES]),
        0.0,
        100.0,
    )
    future_frame["occupancyRate"] = occupancy_predictions
    future_frame["occupiedRoomNights"] = np.clip(
        np.rint(future_frame["totalRooms"] * future_frame["occupancyRate"] / 100.0),
        0,
        future_frame["totalRooms"],
    )
    revenue_predictions = np.clip(
        bundle.revenue_model.predict(future_frame[REVENUE_FEATURES]),
        0.0,
        None,
    )
    future_frame["predictedRevenue"] = revenue_predictions
    future_frame["predictedOccupancy"] = future_frame["occupancyRate"]

    grouped = future_frame.groupby("date", as_index=False).agg(
        predictedRevenue=("predictedRevenue", "sum"),
        weightedOccupied=("occupiedRoomNights", "sum"),
        totalRooms=("totalRooms", "sum"),
    )
    grouped["predictedOccupancy"] = np.where(
        grouped["totalRooms"] > 0,
        (grouped["weightedOccupied"] / grouped["totalRooms"]) * 100.0,
        0.0,
    )
    grouped["predictedOccupancy"] = grouped["predictedOccupancy"].clip(0.0, 100.0)
    grouped = apply_demo_forecast_variation(grouped)

    points = [
        {
            "date": str(row["date"]),
            "predictedRevenue": round(float(row["predictedRevenue"]), 2),
            "predictedOccupancy": round(float(row["predictedOccupancy"]), 2),
        }
        for _, row in grouped.iterrows()
    ]

    revenue_total = float(grouped["predictedRevenue"].sum())
    average_occupancy = float(grouped["predictedOccupancy"].mean()) if not grouped.empty else 0.0
    confidence = calculate_confidence(bundle.metadata, bundle.reference_data)
    start_date = min((point["date"] for point in points), default=str(date.today()))

    return {
        "forecastStart": start_date,
        "forecastDays": forecast_days,
        "predictedRevenueTotal": round(revenue_total, 2),
        "predictedAverageOccupancy": round(average_occupancy, 2),
        "confidence": confidence,
        "points": points,
    }


def generate_pricing_recommendations(bundle: ArtifactBundle) -> list[dict[str, Any]]:
    seven_day_frame = build_future_feature_frame(bundle.reference_data, 7)
    occupancy_predictions = np.clip(
        bundle.occupancy_model.predict(seven_day_frame[OCCUPANCY_FEATURES]),
        0.0,
        100.0,
    )
    seven_day_frame["predictedOccupancy"] = occupancy_predictions

    reference_profiles = latest_room_type_profiles(bundle.reference_data)
    predicted_by_room_type = seven_day_frame.groupby("roomType")["predictedOccupancy"].mean().to_dict()

    recommendations: list[dict[str, Any]] = []
    for room_type, profile in reference_profiles.items():
        predicted_occupancy = float(predicted_by_room_type.get(room_type, 60.0))
        current_price = round_sar_price(float(profile["averageRoomPrice"]))
        adjustment_percent, risk_level, reason = pricing_policy(predicted_occupancy)
        suggested_price = round_sar_price(current_price * (1.0 + adjustment_percent / 100.0))
        recommendations.append(
            {
                "roomType": display_room_type_name(room_type),
                "currentPrice": current_price,
                "suggestedPrice": suggested_price,
                "adjustmentPercent": round(adjustment_percent, 2),
                "riskLevel": risk_level,
                "reason": reason,
            }
        )

    recommendations = dedupe_pricing_recommendations(recommendations)
    recommendations.sort(key=lambda item: item["roomType"])
    return recommendations


def latest_room_type_profiles(reference_data: pd.DataFrame) -> dict[str, dict[str, Any]]:
    profiles: dict[str, dict[str, Any]] = {}
    normalized_reference = reference_data.copy()
    normalized_reference["roomType"] = normalized_reference["roomType"].astype(str).str.strip().apply(display_room_type_name)
    sorted_data = normalized_reference.sort_values(["date", "roomType"])
    for room_type, group in sorted_data.groupby("roomType"):
        latest = group.iloc[-1]
        trailing = group.tail(min(14, len(group)))
        profiles[str(room_type)] = {
            "roomType": str(room_type),
            "roomTypeId": int(latest["roomTypeId"]),
            "totalRooms": int(latest["totalRooms"]),
            "averageRoomPrice": float(
                trailing["averageRoomPrice"].replace(0, np.nan).mean()
                if trailing["averageRoomPrice"].replace(0, np.nan).notna().any()
                else latest["averageRoomPrice"]
            ),
            "confirmedBookings": int(round(float(trailing["confirmedBookings"].mean()))),
            "cancelledBookings": int(round(float(trailing["cancelledBookings"].mean()))),
            "dailyExpenses": float(trailing["dailyExpenses"].mean()),
        }
    return profiles


def display_room_type_name(room_type: str) -> str:
    cleaned = str(room_type or "").strip()
    return ROOM_TYPE_DISPLAY_NAMES.get(cleaned.lower(), cleaned)


def dedupe_pricing_recommendations(recommendations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_room_type: dict[str, dict[str, Any]] = {}
    for recommendation in recommendations:
        room_type = display_room_type_name(recommendation.get("roomType", ""))
        recommendation["roomType"] = room_type
        existing = by_room_type.get(room_type)
        if existing is None or recommendation.get("suggestedPrice", 0) > existing.get("suggestedPrice", 0):
            by_room_type[room_type] = recommendation
    return list(by_room_type.values())


def build_future_feature_frame(reference_data: pd.DataFrame, forecast_days: int) -> pd.DataFrame:
    profiles = latest_room_type_profiles(reference_data)
    forecast_start = date.today()
    rows: list[dict[str, Any]] = []

    for offset in range(forecast_days):
        forecast_date = forecast_start + timedelta(days=offset)
        for room_type, profile in profiles.items():
            demand_factor = demo_demand_factor(forecast_date)
            baseline_bookings = max(int(profile["confirmedBookings"]), 1)
            rows.append(
                {
                    "date": forecast_date,
                    "dayOfWeek": forecast_date.isoweekday(),
                    "month": forecast_date.month,
                    "weekend": forecast_date.isoweekday() in {5, 6},
                    "roomType": room_type,
                    "roomTypeId": profile["roomTypeId"],
                    "totalRooms": profile["totalRooms"],
                    "occupiedRoomNights": 0,
                    "confirmedBookings": max(0, round(baseline_bookings * demand_factor)),
                    "cancelledBookings": profile["cancelledBookings"],
                    "averageRoomPrice": round_sar_price(profile["averageRoomPrice"] * demo_price_factor(forecast_date)),
                    "dailyExpenses": profile["dailyExpenses"],
                    "occupancyRate": 0.0,
                }
            )

    return pd.DataFrame(rows)


def apply_demo_forecast_variation(grouped: pd.DataFrame) -> pd.DataFrame:
    varied = grouped.copy()
    if varied.empty:
        return varied

    revenue_values: list[float] = []
    occupancy_values: list[float] = []
    for _, row in varied.iterrows():
        forecast_date = row["date"]
        if not isinstance(forecast_date, date):
            forecast_date = pd.to_datetime(forecast_date).date()
        demand = demo_demand_factor(forecast_date)
        weekend_lift = 1.10 if forecast_date.isoweekday() in {5, 6} else 1.04 if forecast_date.isoweekday() == 4 else 0.97
        day_wave = 1.0 + (((forecast_date.toordinal() % 7) - 3) * 0.012)
        occupancy_delta = (demand - 1.0) * 18.0
        occupancy_values.append(
            float(np.clip(float(row["predictedOccupancy"]) + occupancy_delta, 35.0, 94.0))
        )
        revenue_values.append(
            max(0.0, float(row["predictedRevenue"]) * demand * weekend_lift * day_wave)
        )

    varied["predictedRevenue"] = revenue_values
    varied["predictedOccupancy"] = occupancy_values
    return varied


def demo_demand_factor(forecast_date: date) -> float:
    factor = 1.0
    if forecast_date.isoweekday() in {5, 6}:
        factor += 0.12
    elif forecast_date.isoweekday() == 4:
        factor += 0.05
    elif forecast_date.isoweekday() in {1, 2}:
        factor -= 0.05

    if forecast_date.month in {6, 7, 8}:
        factor += 0.06
    if forecast_date.month in {9} and 20 <= forecast_date.day <= 25:
        factor += 0.16
    if forecast_date.month in {3, 4, 12, 1}:
        factor += 0.04
    return max(0.82, min(1.28, factor))


def demo_price_factor(forecast_date: date) -> float:
    factor = 1.0
    if forecast_date.isoweekday() in {5, 6}:
        factor += 0.08
    if forecast_date.month in {6, 7, 8, 12, 1}:
        factor += 0.04
    return factor


def round_sar_price(value: float, increment: int = 50) -> float:
    if not np.isfinite(value) or value <= 0:
        return 0.0
    return float(int(round(value / increment) * increment))


def pricing_policy(predicted_occupancy: float) -> tuple[float, str, str]:
    if predicted_occupancy >= 85.0:
        return (
            12.0,
            "LOW",
            "Predicted occupancy is very high for the next 7 days, so a bounded price increase is recommended.",
        )
    if predicted_occupancy >= 75.0:
        return (
            8.0,
            "LOW",
            "Predicted occupancy is high for the next 7 days, so a moderate price increase is recommended.",
        )
    if predicted_occupancy >= 65.0:
        return (
            4.0,
            "MEDIUM",
            "Predicted occupancy is healthy, so only a small upward adjustment is recommended.",
        )
    if predicted_occupancy <= 40.0:
        return (
            -10.0,
            "HIGH",
            "Predicted occupancy is weak, so a bounded discount is recommended to protect demand.",
        )
    if predicted_occupancy <= 55.0:
        return (
            -6.0,
            "MEDIUM",
            "Predicted occupancy is below target, so a moderate discount is recommended.",
        )
    return (
        0.0,
        "LOW",
        "Predicted occupancy is stable, so holding the current price is recommended.",
    )


def calculate_confidence(metadata: dict[str, Any], reference_data: pd.DataFrame) -> float:
    average_daily_revenue = max(float(reference_data["dailyRevenue"].mean()), 1.0)
    revenue_mae = float(metadata.get("revenueMae") or average_daily_revenue)
    occupancy_mae = float(metadata.get("occupancyMae") or 10.0)
    revenue_component = max(0.45, 1.0 - (revenue_mae / max(average_daily_revenue * 2.0, 1.0)))
    occupancy_component = max(0.45, 1.0 - (occupancy_mae / 100.0))
    return round(float(min(0.95, (revenue_component + occupancy_component) / 2.0)), 2)


def _fit_regressor(frame: pd.DataFrame, feature_columns: list[str], target_column: str) -> tuple[Pipeline, float]:
    features = frame[feature_columns]
    target = frame[target_column]

    train_features, test_features, train_target, test_target = train_test_split(
        features,
        target,
        test_size=0.2,
        random_state=42,
    )

    model = _build_pipeline(feature_columns)
    model.fit(train_features, train_target)
    predictions = model.predict(test_features)
    mae = mean_absolute_error(test_target, predictions)

    final_model = _build_pipeline(feature_columns)
    final_model.fit(features, target)
    return final_model, float(mae)


def _build_pipeline(feature_columns: list[str]) -> Pipeline:
    categorical_features = [column for column in feature_columns if column == "roomType"]
    numeric_features = [column for column in feature_columns if column != "roomType"]

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

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=250,
                    random_state=42,
                    min_samples_leaf=2,
                ),
            ),
        ]
    )


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if pd.isna(value):
        return False
    return str(value).strip().lower() in {"true", "1", "yes", "y"}
