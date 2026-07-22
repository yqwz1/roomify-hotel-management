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
    evaluationStrategy: str | None = None
    predictionInterval: dict[str, Any] | None = None
    evaluation: dict[str, Any] | None = None
    trained: bool = True
    status: str | None = None
    message: str | None = None


class ForecastRequest(BaseModel):
    forecastDays: int = Field(default=30, ge=1, le=90)


class ForecastPointResponse(BaseModel):
    date: str
    predictedRevenue: float
    predictedRevenueLower: float | None = None
    predictedRevenueUpper: float | None = None
    predictedOccupancy: float
    predictedOccupancyLower: float | None = None
    predictedOccupancyUpper: float | None = None


class ForecastResponse(BaseModel):
    forecastStart: str
    forecastDays: int
    predictedRevenueTotal: float
    predictedRevenueLowerTotal: float | None = None
    predictedRevenueUpperTotal: float | None = None
    predictedAverageOccupancy: float
    predictedAverageOccupancyLower: float | None = None
    predictedAverageOccupancyUpper: float | None = None
    predictionIntervalLevel: float | None = None
    confidence: float
    points: list[ForecastPointResponse]


class PricingRecommendationResponse(BaseModel):
    roomType: str
    currentPrice: float
    suggestedPrice: float
    adjustmentPercent: float
    riskLevel: str
    reason: str


class ElasticityRoomRequest(BaseModel):
    roomTypeId: int
    roomType: str
    currentPrice: float = Field(gt=0)
    totalRooms: int = Field(gt=0)
    currentOccupancy: float = Field(ge=0, le=100)
    currentBookings: int = Field(ge=0)
    cancellations: int = Field(ge=0)
    averageDailyExpenses: float = Field(ge=0, default=0)


class ElasticityRequest(BaseModel):
    anchorDate: str | None = None
    forecastDays: int = Field(default=30, ge=1, le=90)
    roomTypes: list[ElasticityRoomRequest] = Field(default_factory=list)


class ElasticitySimulationResponse(BaseModel):
    price: float
    occupancy: float
    expectedBookings: int
    revenue: float
    profit: float
    deltaPercentage: float
    recommended: bool = False


class ElasticityForecastResponse(BaseModel):
    roomTypeId: int
    roomType: str
    currentPrice: float
    optimalPrice: float
    expectedOccupancy: float
    expectedBookings: int
    expectedRevenue: float
    expectedProfit: float
    confidenceScore: float
    forecastDays: int
    modelType: str
    priceSimulations: list[ElasticitySimulationResponse]
