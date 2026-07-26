from pydantic import BaseModel, Field

from app.weather.domain.entities.weather_assessment import WeatherRiskLevel


class AssessWeatherRequest(BaseModel):
    lat: float = Field(..., description="Latitud GPS del usuario")
    lon: float = Field(..., description="Longitud GPS del usuario")
    travel_hour: int | None = Field(
        default=None,
        ge=0,
        le=23,
        description="Hora local de viaje (0-23). Default 7 si se omite.",
    )


class WeatherMetricsResponse(BaseModel):
    temperature_c: float
    feels_like_c: float
    humidity_percent: int
    wind_speed_ms: float
    rain_probability: int
    condition: str
    description: str
    matched_local_time: str
    requested_travel_hour: int


class AssessWeatherResponse(BaseModel):
    location: dict
    metrics: WeatherMetricsResponse
    risk_level: WeatherRiskLevel
    explanation: str
    recommendation: str

    model_config = {"use_enum_values": True}
