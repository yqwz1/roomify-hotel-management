from __future__ import annotations

import os

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from elasticity_service import generate_elasticity_forecasts
from model import generate_forecast, generate_pricing_recommendations, load_artifacts, load_model_metadata
from schemas import (
    ElasticityForecastResponse,
    ElasticityRequest,
    ForecastRequest,
    ForecastResponse,
    HealthResponse,
    ModelInfoResponse,
    PricingRecommendationResponse,
)

app = FastAPI(title="Roomify AI Finance Service", version="1.0.0")


def _allowed_origins() -> list[str]:
    raw_value = os.getenv("AI_SERVICE_CORS_ALLOWED_ORIGINS", "")
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


allowed_origins = _allowed_origins()
if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="UP", service="ai-finance-service")


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    metadata = load_model_metadata()
    if metadata is None:
        return ModelInfoResponse(
            trained=False,
            status="MODEL_NOT_TRAINED",
            message="Model artifacts are missing. Run `python train.py` first.",
        )
    return ModelInfoResponse(**metadata)


@app.post("/forecast/full", response_model=ForecastResponse)
def forecast_full(request: ForecastRequest | None = Body(default=None)) -> ForecastResponse:
    try:
        bundle = load_artifacts()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    forecast_days = request.forecastDays if request else 30
    try:
        return ForecastResponse(**generate_forecast(bundle, forecast_days))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"forecast generation failed: {exc}") from exc


@app.post("/pricing/recommendations", response_model=list[PricingRecommendationResponse])
def pricing_recommendations() -> list[PricingRecommendationResponse]:
    try:
        bundle = load_artifacts()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        return [PricingRecommendationResponse(**item) for item in generate_pricing_recommendations(bundle)]
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"pricing recommendation generation failed: {exc}") from exc


@app.post("/elasticity/simulate", response_model=list[ElasticityForecastResponse])
def elasticity_simulation(request: ElasticityRequest) -> list[ElasticityForecastResponse]:
    try:
        bundle = load_artifacts()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        forecasts = generate_elasticity_forecasts(bundle, request)
        return [ElasticityForecastResponse(**item) for item in forecasts]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"elasticity simulation failed: {exc}") from exc
