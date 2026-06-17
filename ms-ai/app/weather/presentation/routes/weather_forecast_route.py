from fastapi import APIRouter, Depends, Query

from app.config.settings import settings
from app.weather.infrastructure.clients.openweather_client import OpenWeatherClient
from app.weather.presentation.injection import get_weather_provider

router = APIRouter(prefix="/api/weather/forecast", tags=["Weather Forecast"])


@router.get("/available-hours")
def list_available_forecast_hours(
    lat: float = Query(..., description="Latitud de la ciudad"),
    lon: float = Query(..., description="Longitud de la ciudad"),
    weather_provider: OpenWeatherClient = Depends(get_weather_provider),
):
    """Lista los bloques horarios futuros que devuelve OpenWeatherMap para unas coordenadas."""
    hours = weather_provider.list_available_local_hours(lat=lat, lon=lon)
    return {
        "lat": lat,
        "lon": lon,
        "forecast_mode": settings.OPENWEATHER_FORECAST_MODE,
        "step_note": "La API gratuita usa bloques cada 3 horas; se elige el más cercano al travel_hour.",
        "available_local_hours": hours,
    }
