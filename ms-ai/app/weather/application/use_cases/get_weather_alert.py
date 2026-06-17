from app.weather.application.dto.weather_alert_dto import WeatherAlertDTO
from app.weather.application.mappers.weather_alert_mapper import weather_notification_to_dto
from app.weather.domain.ports.iweather_notification_repository import IWeatherNotificationRepository


class GetWeatherAlertUseCase:
    def __init__(self, repo: IWeatherNotificationRepository) -> None:
        self.repo = repo

    def execute(self, alert_id: str) -> WeatherAlertDTO | None:
        entity = self.repo.get_by_id(alert_id)
        return weather_notification_to_dto(entity) if entity else None
