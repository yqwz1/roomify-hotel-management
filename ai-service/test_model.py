from __future__ import annotations

import unittest
from datetime import date, timedelta

import numpy as np
import pandas as pd

from model import (
    OCCUPANCY_FEATURES,
    REVENUE_FEATURES,
    ArtifactBundle,
    _build_pipeline,
    _chronological_holdout,
    _predict_with_tree_intervals,
    build_future_feature_frame,
    generate_forecast,
    normalize_training_frame,
)


def build_training_frame(days: int = 48) -> pd.DataFrame:
    rows = []
    start = date(2026, 1, 1)
    for offset in range(days):
        current_date = start + timedelta(days=offset)
        for room_type_id, room_type, room_price in [
            (1, "Standard", 420.0),
            (2, "Deluxe", 760.0),
        ]:
            occupancy = 48.0 + (offset % 14) * 2.2 + room_type_id * 3.0
            total_rooms = 20 + room_type_id * 5
            occupied = round(total_rooms * occupancy / 100.0)
            rows.append(
                {
                    "date": current_date,
                    "dayOfWeek": current_date.isoweekday(),
                    "month": current_date.month,
                    "weekend": current_date.isoweekday() in {5, 6},
                    "roomType": room_type,
                    "roomTypeId": room_type_id,
                    "totalRooms": total_rooms,
                    "occupiedRoomNights": occupied,
                    "confirmedBookings": occupied,
                    "cancelledBookings": offset % 3,
                    "averageRoomPrice": room_price,
                    "dailyRevenue": occupied * room_price,
                    "dailyExpenses": 150.0 + room_type_id * 30.0,
                    "occupancyRate": occupancy,
                }
            )
    return normalize_training_frame(pd.DataFrame(rows))


class AiFinanceModelTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.frame = build_training_frame()

    def test_chronological_holdout_keeps_future_dates_out_of_training(self) -> None:
        train, holdout, split_date = _chronological_holdout(self.frame)

        self.assertLess(train["date"].max(), split_date)
        self.assertGreaterEqual(holdout["date"].min(), split_date)
        self.assertTrue(set(train["date"]).isdisjoint(set(holdout["date"])))

    def test_tree_intervals_bound_point_predictions(self) -> None:
        model = _build_pipeline(OCCUPANCY_FEATURES)
        model.fit(self.frame[OCCUPANCY_FEATURES], self.frame["occupancyRate"])

        point, lower, upper = _predict_with_tree_intervals(
            model,
            self.frame.tail(8)[OCCUPANCY_FEATURES],
            lower_bound=0.0,
            upper_bound=100.0,
        )

        self.assertEqual(len(point), 8)
        self.assertTrue(np.all(lower <= point))
        self.assertTrue(np.all(point <= upper))

    def test_forecast_exposes_daily_prediction_intervals(self) -> None:
        occupancy_model = _build_pipeline(OCCUPANCY_FEATURES)
        occupancy_model.fit(self.frame[OCCUPANCY_FEATURES], self.frame["occupancyRate"])
        revenue_model = _build_pipeline(REVENUE_FEATURES)
        revenue_model.fit(self.frame[REVENUE_FEATURES], self.frame["dailyRevenue"])
        bundle = ArtifactBundle(
            revenue_model=revenue_model,
            occupancy_model=occupancy_model,
            metadata={"revenueMae": 100.0, "occupancyMae": 5.0},
            reference_data=self.frame,
        )

        forecast = generate_forecast(bundle, forecast_days=5)

        self.assertEqual(forecast["predictionIntervalLevel"], 0.8)
        self.assertEqual(len(forecast["points"]), 5)
        for point in forecast["points"]:
            self.assertLessEqual(point["predictedRevenueLower"], point["predictedRevenue"])
            self.assertLessEqual(point["predictedRevenue"], point["predictedRevenueUpper"])
            self.assertLessEqual(point["predictedOccupancyLower"], point["predictedOccupancy"])
            self.assertLessEqual(point["predictedOccupancy"], point["predictedOccupancyUpper"])

    def test_future_dates_never_start_in_the_past(self) -> None:
        as_of_date = date(2026, 7, 22)
        future_frame = build_future_feature_frame(
            self.frame,
            forecast_days=2,
            as_of_date=as_of_date,
        )
        forecast_dates = sorted(future_frame["date"].unique())

        self.assertEqual(forecast_dates[0], as_of_date + timedelta(days=1))
        self.assertEqual(forecast_dates[1], as_of_date + timedelta(days=2))


if __name__ == "__main__":
    unittest.main()
