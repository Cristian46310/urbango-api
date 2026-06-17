from typing import Protocol

from app.weather.domain.entities.weather_forecast import WeatherForecast
from app.weather.domain.entities.weather_notification import WeatherNotification


class IWeatherNotificationOrchestrator(Protocol):
    def notify_weather_alert(
        self,
        subscription: WeatherNotification,
        forecast: WeatherForecast,
    ) -> None: ...
