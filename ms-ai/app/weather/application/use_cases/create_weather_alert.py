import uuid
from datetime import datetime

from app.weather.application.dto.weather_alert_dto import WeatherAlertDTO
from app.weather.application.helpers.weather_alert_validators import (
    validate_email,
    validate_travel_hour,
    validate_user_id,
)
from app.weather.application.mappers.weather_alert_mapper import weather_notification_to_dto
from app.weather.domain.entities.notification_channel import NotificationChannel
from app.weather.domain.entities.weather_notification import WeatherNotification
from app.weather.domain.ports.iweather_notification_repository import IWeatherNotificationRepository
from app.weather.domain.ports.iweather_provider import IWeatherProvider


class CreateWeatherAlertUseCase:
    def __init__(
        self,
        repo: IWeatherNotificationRepository,
        weather_provider: IWeatherProvider,
    ) -> None:
        self.repo = repo
        self.weather_provider = weather_provider

    def execute(
        self,
        user_id: str,
        user_email: str,
        travel_hour: int,
        city_name: str,
        preferred_channel: NotificationChannel = NotificationChannel.EMAIL,
    ) -> WeatherAlertDTO:
        validate_user_id(user_id)
        validate_email(user_email)
        validate_travel_hour(travel_hour)

        geocoded = self.weather_provider.geocode(city_name)
        now = datetime.now()

        notification = WeatherNotification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            user_email=user_email,
            travel_hour=travel_hour,
            city_name=geocoded.name,
            city_lat=geocoded.lat,
            city_lon=geocoded.lon,
            preferred_channel=preferred_channel,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        saved = self.repo.create(notification)
        return weather_notification_to_dto(saved)
