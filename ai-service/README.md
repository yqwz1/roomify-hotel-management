# AI Finance Service

Install:

```bash
pip install -r requirements.txt
```

Train:

```bash
# Optional: fetch fresh manager-protected data instead of using the cached CSV.
export ROOMIFY_TRAIN_EMAIL="manager@example.com"
export ROOMIFY_TRAIN_PASSWORD="your-password"
python train.py
```

Run:

```bash
uvicorn main:app --reload --port 8000
```

Endpoints:
- `GET /health`
- `GET /model-info`
- `POST /forecast/full`
- `POST /pricing/recommendations`

Model details:
- Model type: `RandomForestRegressor`
- Model version: `ai-finance-v2`
- Revenue target: `dailyRevenue`
- Occupancy target: `occupancyRate`
- Evaluation: chronological holdout, room-type median baseline, MAE/RMSE/R², and 3-fold rolling-origin MAE
- Forecast uncertainty: 80% Random Forest tree-spread intervals returned for revenue and occupancy
- Training data source: Spring Boot `GET /api/ai-finance/training-data` first, then `ai-service/data/training_data.csv` fallback
- Saved artifacts: `models/revenue_model.joblib`, `models/occupancy_model.joblib`, `models/model_metadata.json`

Pricing recommendation policy:
- The ML model predicts revenue and occupancy.
- Pricing recommendations use a bounded business policy based on model predictions, not a pure ML pricing model.
- Upward and downward price moves are capped to avoid extreme suggestions.

Limitations:
- The interval is an uncalibrated ensemble-spread interval, not a statistical confidence interval.
- The committed training data is seeded/demo-oriented, so evaluation metrics must not be generalized to independent hotel data.
- Forecast features for future dates are derived from the latest observed room-type profiles, so long-horizon accuracy is limited.
- Forecast dates begin after the later of today or the latest reference-data date, preventing stale "next 30 days" labels.
- Expenses are allocated from aggregated daily expense history rather than room-type-specific accounting data.
- If the Spring Boot endpoint requires auth, training falls back to the local CSV cache instead of blocking the whole service.
