from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
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
MODEL_VERSION = "ai-finance-v2"
INTERVAL_LEVEL = 0.80
INTERVAL_LOWER_QUANTILE = (1.0 - INTERVAL_LEVEL) / 2.0
INTERVAL_UPPER_QUANTILE = 1.0 - INTERVAL_LOWER_QUANTILE
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


@dataclass
class ArtifactBundle:
    revenue_model: Any
    occupancy_model: Any
    metadata: dict[str, Any]
    reference_data: pd.DataFrame


@dataclass(frozen=True)
class ModelEvaluation:
    split_date: str
    train_rows: int
    holdout_rows: int
    mae: float
    rmse: float
    r2: float
    baseline_mae: float
    improvement_percent: float
    rolling_mae: float | None
    rolling_folds: int

    def to_metadata(self) -> dict[str, Any]:
        return {
            "splitDate": self.split_date,
            "trainRows": self.train_rows,
            "holdoutRows": self.holdout_rows,
            "mae": round(self.mae, 4),
            "rmse": round(self.rmse, 4),
            "r2": round(self.r2, 4),
            "baselineMae": round(self.baseline_mae, 4),
            "improvementPercent": round(self.improvement_percent, 2),
            "rollingMae": round(self.rolling_mae, 4) if self.rolling_mae is not None else None,
            "rollingFolds": self.rolling_folds,
        }


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
    normalized["roomType"] = normalized["roomType"].astype(str).str.strip()
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

    revenue_model, revenue_evaluation = _fit_regressor(normalized, REVENUE_FEATURES, TARGET_REVENUE)
    occupancy_model, occupancy_evaluation = _fit_regressor(normalized, OCCUPANCY_FEATURES, TARGET_OCCUPANCY)

    joblib.dump(revenue_model, REVENUE_MODEL_PATH)
    joblib.dump(occupancy_model, OCCUPANCY_MODEL_PATH)
    normalized.to_csv(REFERENCE_DATA_PATH, index=False)

    metadata = {
        "modelType": MODEL_TYPE,
        "trainedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "trainingRows": int(len(normalized)),
        "revenueMae": round(revenue_evaluation.mae, 4),
        "occupancyMae": round(occupancy_evaluation.mae, 4),
        "features": METADATA_FEATURES,
        "targets": TARGETS,
        "trainingDateRange": {
            "start": str(normalized["date"].min()),
            "end": str(normalized["date"].max()),
        },
        "modelVersion": MODEL_VERSION,
        "evaluationStrategy": "chronological holdout plus 3-fold rolling-origin validation",
        "predictionInterval": {
            "level": INTERVAL_LEVEL,
            "method": "random-forest tree prediction quantiles",
            "calibrated": False,
        },
        "evaluation": {
            "revenue": revenue_evaluation.to_metadata(),
            "occupancy": occupancy_evaluation.to_metadata(),
        },
    }
    MODEL_METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    load_artifacts.cache_clear()
    return metadata


@lru_cache(maxsize=1)
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
    occupancy_predictions, occupancy_lower, occupancy_upper = _predict_with_tree_intervals(
        bundle.occupancy_model,
        future_frame[OCCUPANCY_FEATURES],
        lower_bound=0.0,
        upper_bound=100.0,
    )
    future_frame["occupancyRate"] = occupancy_predictions
    future_frame["predictedOccupancyLower"] = occupancy_lower
    future_frame["predictedOccupancyUpper"] = occupancy_upper
    future_frame["occupiedRoomNights"] = np.clip(
        np.rint(future_frame["totalRooms"] * future_frame["occupancyRate"] / 100.0),
        0,
        future_frame["totalRooms"],
    )
    revenue_predictions, revenue_lower, revenue_upper = _predict_with_tree_intervals(
        bundle.revenue_model,
        future_frame[REVENUE_FEATURES],
        lower_bound=0.0,
    )
    future_frame["predictedRevenue"] = revenue_predictions
    future_frame["predictedRevenueLower"] = revenue_lower
    future_frame["predictedRevenueUpper"] = revenue_upper
    future_frame["predictedOccupancy"] = future_frame["occupancyRate"]
    future_frame["weightedOccupancyLower"] = (
        future_frame["totalRooms"] * future_frame["predictedOccupancyLower"] / 100.0
    )
    future_frame["weightedOccupancyUpper"] = (
        future_frame["totalRooms"] * future_frame["predictedOccupancyUpper"] / 100.0
    )

    grouped = future_frame.groupby("date", as_index=False).agg(
        predictedRevenue=("predictedRevenue", "sum"),
        predictedRevenueLower=("predictedRevenueLower", "sum"),
        predictedRevenueUpper=("predictedRevenueUpper", "sum"),
        weightedOccupied=("occupiedRoomNights", "sum"),
        weightedOccupancyLower=("weightedOccupancyLower", "sum"),
        weightedOccupancyUpper=("weightedOccupancyUpper", "sum"),
        totalRooms=("totalRooms", "sum"),
    )
    grouped["predictedOccupancy"] = np.where(
        grouped["totalRooms"] > 0,
        (grouped["weightedOccupied"] / grouped["totalRooms"]) * 100.0,
        0.0,
    )
    grouped["predictedOccupancy"] = grouped["predictedOccupancy"].clip(0.0, 100.0)
    grouped["predictedOccupancyLower"] = np.where(
        grouped["totalRooms"] > 0,
        (grouped["weightedOccupancyLower"] / grouped["totalRooms"]) * 100.0,
        0.0,
    ).clip(0.0, 100.0)
    grouped["predictedOccupancyUpper"] = np.where(
        grouped["totalRooms"] > 0,
        (grouped["weightedOccupancyUpper"] / grouped["totalRooms"]) * 100.0,
        0.0,
    ).clip(0.0, 100.0)
    grouped["predictedOccupancyLower"] = np.minimum(
        grouped["predictedOccupancyLower"], grouped["predictedOccupancy"]
    )
    grouped["predictedOccupancyUpper"] = np.maximum(
        grouped["predictedOccupancyUpper"], grouped["predictedOccupancy"]
    )

    points = [
        {
            "date": str(row["date"]),
            "predictedRevenue": round(float(row["predictedRevenue"]), 2),
            "predictedRevenueLower": round(float(row["predictedRevenueLower"]), 2),
            "predictedRevenueUpper": round(float(row["predictedRevenueUpper"]), 2),
            "predictedOccupancy": round(float(row["predictedOccupancy"]), 2),
            "predictedOccupancyLower": round(float(row["predictedOccupancyLower"]), 2),
            "predictedOccupancyUpper": round(float(row["predictedOccupancyUpper"]), 2),
        }
        for _, row in grouped.iterrows()
    ]

    revenue_total = float(grouped["predictedRevenue"].sum())
    revenue_lower_total = float(grouped["predictedRevenueLower"].sum())
    revenue_upper_total = float(grouped["predictedRevenueUpper"].sum())
    average_occupancy = float(grouped["predictedOccupancy"].mean()) if not grouped.empty else 0.0
    average_occupancy_lower = (
        float(grouped["predictedOccupancyLower"].mean()) if not grouped.empty else 0.0
    )
    average_occupancy_upper = (
        float(grouped["predictedOccupancyUpper"].mean()) if not grouped.empty else 0.0
    )
    confidence = calculate_confidence(bundle.metadata, bundle.reference_data)
    start_date = min((point["date"] for point in points), default=str(date.today()))

    return {
        "forecastStart": start_date,
        "forecastDays": forecast_days,
        "predictedRevenueTotal": round(revenue_total, 2),
        "predictedRevenueLowerTotal": round(revenue_lower_total, 2),
        "predictedRevenueUpperTotal": round(revenue_upper_total, 2),
        "predictedAverageOccupancy": round(average_occupancy, 2),
        "predictedAverageOccupancyLower": round(average_occupancy_lower, 2),
        "predictedAverageOccupancyUpper": round(average_occupancy_upper, 2),
        "predictionIntervalLevel": INTERVAL_LEVEL,
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
        current_price = round(float(profile["averageRoomPrice"]), 2)
        adjustment_percent, risk_level, reason = pricing_policy(predicted_occupancy)
        suggested_price = round(current_price * (1.0 + adjustment_percent / 100.0), 2)
        recommendations.append(
            {
                "roomType": room_type,
                "currentPrice": current_price,
                "suggestedPrice": suggested_price,
                "adjustmentPercent": round(adjustment_percent, 2),
                "riskLevel": risk_level,
                "reason": reason,
            }
        )

    recommendations.sort(key=lambda item: item["roomType"])
    return recommendations


def latest_room_type_profiles(reference_data: pd.DataFrame) -> dict[str, dict[str, Any]]:
    profiles: dict[str, dict[str, Any]] = {}
    sorted_data = reference_data.sort_values(["date", "roomType"])
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


def build_future_feature_frame(
    reference_data: pd.DataFrame,
    forecast_days: int,
    as_of_date: date | None = None,
) -> pd.DataFrame:
    profiles = latest_room_type_profiles(reference_data)
    last_date = pd.to_datetime(reference_data["date"]).dt.date.max()
    forecast_anchor = max(last_date, as_of_date or date.today())
    rows: list[dict[str, Any]] = []

    for offset in range(1, forecast_days + 1):
        forecast_date = forecast_anchor + timedelta(days=offset)
        for room_type, profile in profiles.items():
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
                    "confirmedBookings": profile["confirmedBookings"],
                    "cancelledBookings": profile["cancelledBookings"],
                    "averageRoomPrice": profile["averageRoomPrice"],
                    "dailyExpenses": profile["dailyExpenses"],
                    "occupancyRate": 0.0,
                }
            )

    return pd.DataFrame(rows)


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


def _fit_regressor(
    frame: pd.DataFrame,
    feature_columns: list[str],
    target_column: str,
) -> tuple[Pipeline, ModelEvaluation]:
    train_frame, holdout_frame, split_date = _chronological_holdout(frame)

    evaluation_model = _build_pipeline(feature_columns)
    evaluation_model.fit(train_frame[feature_columns], train_frame[target_column])
    predictions = evaluation_model.predict(holdout_frame[feature_columns])
    actual = holdout_frame[target_column]

    mae = float(mean_absolute_error(actual, predictions))
    rmse = float(root_mean_squared_error(actual, predictions))
    r2 = float(r2_score(actual, predictions))
    baseline_predictions = _room_type_baseline(train_frame, holdout_frame, target_column)
    baseline_mae = float(mean_absolute_error(actual, baseline_predictions))
    improvement_percent = (
        ((baseline_mae - mae) / baseline_mae) * 100.0 if baseline_mae > 0 else 0.0
    )
    rolling_mae, rolling_folds = _rolling_origin_mae(frame, feature_columns, target_column)

    evaluation = ModelEvaluation(
        split_date=str(split_date),
        train_rows=len(train_frame),
        holdout_rows=len(holdout_frame),
        mae=mae,
        rmse=rmse,
        r2=r2,
        baseline_mae=baseline_mae,
        improvement_percent=improvement_percent,
        rolling_mae=rolling_mae,
        rolling_folds=rolling_folds,
    )

    production_model = _build_pipeline(feature_columns)
    production_model.fit(frame[feature_columns], frame[target_column])
    return production_model, evaluation


def _chronological_holdout(
    frame: pd.DataFrame,
    holdout_fraction: float = 0.20,
) -> tuple[pd.DataFrame, pd.DataFrame, date]:
    unique_dates = sorted(frame["date"].dropna().unique())
    if len(unique_dates) < 5:
        raise ValueError("at least 5 unique dates are required for chronological evaluation")

    split_index = min(
        max(int(len(unique_dates) * (1.0 - holdout_fraction)), 1),
        len(unique_dates) - 1,
    )
    split_date = unique_dates[split_index]
    train_frame = frame[frame["date"] < split_date].copy()
    holdout_frame = frame[frame["date"] >= split_date].copy()
    if train_frame.empty or holdout_frame.empty:
        raise ValueError("chronological split produced an empty train or holdout set")
    return train_frame, holdout_frame, split_date


def _room_type_baseline(
    train_frame: pd.DataFrame,
    evaluation_frame: pd.DataFrame,
    target_column: str,
) -> np.ndarray:
    room_type_medians = train_frame.groupby("roomType")[target_column].median()
    overall_median = float(train_frame[target_column].median())
    return (
        evaluation_frame["roomType"]
        .map(room_type_medians)
        .fillna(overall_median)
        .to_numpy(dtype=float)
    )


def _rolling_origin_mae(
    frame: pd.DataFrame,
    feature_columns: list[str],
    target_column: str,
    requested_folds: int = 3,
) -> tuple[float | None, int]:
    unique_dates = np.array(sorted(frame["date"].dropna().unique()), dtype=object)
    if len(unique_dates) < requested_folds + 2:
        return None, 0

    date_folds = [fold for fold in np.array_split(unique_dates, requested_folds + 1) if len(fold)]
    fold_actual: list[np.ndarray] = []
    fold_predictions: list[np.ndarray] = []

    for fold_index in range(1, len(date_folds)):
        train_dates = np.concatenate(date_folds[:fold_index])
        validation_dates = date_folds[fold_index]
        train_fold = frame[frame["date"].isin(train_dates)]
        validation_fold = frame[frame["date"].isin(validation_dates)]
        if train_fold.empty or validation_fold.empty:
            continue

        fold_model = _build_pipeline(feature_columns)
        fold_model.fit(train_fold[feature_columns], train_fold[target_column])
        fold_predictions.append(fold_model.predict(validation_fold[feature_columns]))
        fold_actual.append(validation_fold[target_column].to_numpy(dtype=float))

    if not fold_actual:
        return None, 0
    actual = np.concatenate(fold_actual)
    predictions = np.concatenate(fold_predictions)
    return float(mean_absolute_error(actual, predictions)), len(fold_actual)


def _predict_with_tree_intervals(
    model: Pipeline,
    features: pd.DataFrame,
    *,
    lower_bound: float | None = None,
    upper_bound: float | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    preprocessor = model.named_steps.get("preprocessor")
    regressor = model.named_steps.get("model")
    if preprocessor is None or not isinstance(regressor, RandomForestRegressor):
        predictions = np.asarray(model.predict(features), dtype=float)
        clipped = np.clip(predictions, lower_bound, upper_bound)
        return clipped, clipped.copy(), clipped.copy()

    transformed = preprocessor.transform(features)
    tree_predictions = np.column_stack(
        [estimator.predict(transformed) for estimator in regressor.estimators_]
    )
    predictions = tree_predictions.mean(axis=1)
    lower = np.quantile(tree_predictions, INTERVAL_LOWER_QUANTILE, axis=1)
    upper = np.quantile(tree_predictions, INTERVAL_UPPER_QUANTILE, axis=1)
    lower = np.minimum(lower, predictions)
    upper = np.maximum(upper, predictions)
    return (
        np.clip(predictions, lower_bound, upper_bound),
        np.clip(lower, lower_bound, upper_bound),
        np.clip(upper, lower_bound, upper_bound),
    )


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
