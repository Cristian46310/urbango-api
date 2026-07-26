from enum import Enum

from pydantic import BaseModel, Field

from app.weather.domain.entities.weather_forecast import WeatherForecast


class WeatherRiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WeatherAssessment(BaseModel):
    """Deterministic metrics + NL interpretation. LLM never invents metrics."""

    lat: float
    lon: float
    metrics: WeatherForecast
    risk_level: WeatherRiskLevel
    explanation: str = ""
    recommendation: str = ""
