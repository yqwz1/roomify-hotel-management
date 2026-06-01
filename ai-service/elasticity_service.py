from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd

from elasticity_model import PRICE_DELTAS, build_elasticity_model, predict_occupancy
from model import ArtifactBundle, calculate_confidence
from schemas import ElasticityRequest


def generate_elasticity_forecasts(bundle: ArtifactBundle, request: ElasticityRequest) -> list[dict[str, Any]]:
    if not request.roomTypes:
        raise ValueError("at least one room type is required for elasticity simulation")

    model_bundle = build_elasticity_model(bundle.reference_data)
    confidence = _confidence_score(bundle, model_bundle.training_rows)
    anchor_date = _resolve_anchor_date(request.anchorDate, bundle.reference_data)

    forecasts: list[dict[str, Any]] = []
    for room_request in request.roomTypes:
        simulations: list[dict[str, Any]] = []
        for delta in PRICE_DELTAS:
            simulated_price = round(room_request.currentPrice * (1.0 + delta), 2)
            scenario_frame = _build_scenario_frame(
                room_request,
                anchor_date,
                request.forecastDays,
                simulated_price,
                delta,
            )
            occupancies = predict_occupancy(model_bundle, scenario_frame)

            daily_bookings = np.clip(
                np.rint(room_request.totalRooms * occupancies / 100.0),
                0,
                room_request.totalRooms,
            )
            revenue = float(np.sum(daily_bookings * simulated_price))
            profit = float(revenue - (room_request.averageDailyExpenses * request.forecastDays))
            average_occupancy = float(np.mean(occupancies))
            total_bookings = int(np.sum(daily_bookings))

            simulations.append(
                {
                    "price": round(float(simulated_price), 2),
                    "occupancy": round(average_occupancy, 2),
                    "expectedBookings": total_bookings,
                    "revenue": round(revenue, 2),
                    "profit": round(profit, 2),
                    "deltaPercentage": round(delta * 100.0, 2),
                    "recommended": False,
                }
            )

        optimal = max(
            simulations,
            key=lambda item: (item["profit"], item["revenue"], item["occupancy"]),
        )
        for simulation in simulations:
            simulation["recommended"] = simulation["price"] == optimal["price"]

        forecasts.append(
            {
                "roomTypeId": room_request.roomTypeId,
                "roomType": room_request.roomType,
                "currentPrice": round(float(room_request.currentPrice), 2),
                "optimalPrice": optimal["price"],
                "expectedOccupancy": optimal["occupancy"],
                "expectedBookings": optimal["expectedBookings"],
                "expectedRevenue": optimal["revenue"],
                "expectedProfit": optimal["profit"],
                "confidenceScore": confidence,
                "forecastDays": request.forecastDays,
                "modelType": model_bundle.model_type,
                "priceSimulations": simulations,
            }
        )

    forecasts.sort(key=lambda item: item["roomType"])
    return forecasts


def _build_scenario_frame(
    room_request: Any,
    anchor_date: date,
    forecast_days: int,
    simulated_price: float,
    delta: float,
) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for offset in range(forecast_days):
        scenario_date = anchor_date + timedelta(days=offset)
        rows.append(
            {
                "roomType": room_request.roomType,
                "month": scenario_date.month,
                "dayOfWeek": scenario_date.isoweekday(),
                "season": _season_for_month(scenario_date.month),
                "weekend": scenario_date.isoweekday() in {5, 6},
                "currentOccupancy": float(room_request.currentOccupancy),
                "currentBookings": int(room_request.currentBookings),
                "cancellations": int(room_request.cancellations),
                "currentPrice": round(float(room_request.currentPrice), 2),
                "simulatedPrice": round(float(simulated_price), 2),
                "priceDeltaPercentage": round(delta * 100.0, 2),
            }
        )
    return pd.DataFrame(rows)


def _confidence_score(bundle: ArtifactBundle, training_rows: int) -> float:
    base_confidence = calculate_confidence(bundle.metadata, bundle.reference_data)
    training_component = min(0.12, max(0.0, training_rows / 12000.0))
    return round(float(min(0.96, base_confidence + training_component)), 2)


def _resolve_anchor_date(anchor_date: str | None, reference_data: pd.DataFrame) -> date:
    if anchor_date:
        return datetime.fromisoformat(anchor_date).date()

    last_reference_date = pd.to_datetime(reference_data["date"]).dt.date.max()
    today = date.today()
    return max(today, last_reference_date + timedelta(days=1))


def _season_for_month(month: int) -> str:
    if month in {12, 1, 2}:
        return "winter"
    if month in {3, 4, 5}:
        return "spring"
    if month in {6, 7, 8}:
        return "summer"
    return "autumn"
