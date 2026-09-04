from typing import Protocol

from app.weather.domain.entities.weather_assessment import WeatherRiskLevel
from app.weather.domain.entities.weather_forecast import WeatherForecast


class IWeatherInterpreter(Protocol):
    def compose(
        self,
        forecast: WeatherForecast,
        risk_level: WeatherRiskLevel,
        *,
        lat: float,
        lon: float,
    ) -> tuple[str, str]:
        """Return (explanation, recommendation) from fixed metrics only."""
        ...
