from app.config.settings import settings
from app.weather.domain.entities.weather_assessment import WeatherRiskLevel
from app.weather.domain.entities.weather_forecast import WeatherForecast


def compute_weather_risk(forecast: WeatherForecast) -> WeatherRiskLevel:
    """Deterministic risk from OpenWeather metrics. Never delegated to the LLM."""
    rain = forecast.rain_probability
    if rain >= settings.WEATHER_RAIN_HIGH_THRESHOLD_PERCENT:
        return WeatherRiskLevel.HIGH
    if rain >= settings.WEATHER_RAIN_THRESHOLD_PERCENT:
        return WeatherRiskLevel.MEDIUM
    return WeatherRiskLevel.LOW
