# AI Finance Service

Install:

```bash
pip install -r requirements.txt
```

Train:

```bash
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
- Revenue target: `dailyRevenue`
- Occupancy target: `occupancyRate`
- Training data source: Spring Boot `GET /api/ai-finance/training-data` first, then `ai-service/data/training_data.csv` fallback
- Saved artifacts: `models/revenue_model.joblib`, `models/occupancy_model.joblib`, `models/model_metadata.json`

Pricing recommendation policy:
- The ML model predicts revenue and occupancy.
- Pricing recommendations use a bounded business policy based on model predictions, not a pure ML pricing model.
- Upward and downward price moves are capped to avoid extreme suggestions.

Limitations:
- Forecast features for future dates are derived from the latest observed room-type profiles, so long-horizon accuracy is limited.
- Expenses are allocated from aggregated daily expense history rather than room-type-specific accounting data.
- If the Spring Boot endpoint requires auth, training falls back to the local CSV cache instead of blocking the whole service.
