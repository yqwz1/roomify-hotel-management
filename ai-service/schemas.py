from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str


class ModelInfoResponse(BaseModel):
    modelType: str | None = None
    trainedAt: str | None = None
    trainingRows: int | None = None
    revenueMae: float | None = None
    occupancyMae: float | None = None
    features: list[str] = Field(default_factory=list)
    targets: list[str] = Field(default_factory=list)
    trainingDateRange: dict[str, Any] | None = None
    modelVersion: str | None = None
    trained: bool = True
    status: str | None = None
    message: str | None = None


class ForecastRequest(BaseModel):
    forecastDays: int = Field(default=30, ge=1, le=90)


class ForecastPointResponse(BaseModel):
    date: str
    predictedRevenue: float
    predictedOccupancy: float


class ForecastResponse(BaseModel):
    forecastStart: str
    forecastDays: int
    predictedRevenueTotal: float
    predictedAverageOccupancy: float
    confidence: float
    points: list[ForecastPointResponse]


class PricingRecommendationResponse(BaseModel):
    roomType: str
    currentPrice: float
    suggestedPrice: float
    adjustmentPercent: float
    riskLevel: str
    reason: str
