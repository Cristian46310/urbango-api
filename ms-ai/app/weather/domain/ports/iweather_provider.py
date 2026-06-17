from typing import Protocol

from app.weather.domain.entities.weather_forecast import WeatherForecast


class GeocodedCity:
    def __init__(self, name: str, lat: float, lon: float) -> None:
        self.name = name
        self.lat = lat
        self.lon = lon


class IWeatherProvider(Protocol):
    def geocode(self, city_name: str) -> GeocodedCity: ...

    def get_daily_forecast(self, lat: float, lon: float, travel_hour: int) -> WeatherForecast: ...
