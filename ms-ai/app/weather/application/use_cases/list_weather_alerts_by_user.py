from app.weather.application.dto.weather_alert_dto import WeatherAlertDTO
from app.weather.application.mappers.weather_alert_mapper import weather_notification_to_dto
from app.weather.domain.ports.iweather_notification_repository import IWeatherNotificationRepository


class ListWeatherAlertsByUserUseCase:
    def __init__(self, repo: IWeatherNotificationRepository) -> None:
        self.repo = repo

    def execute(self, user_id: str) -> list[WeatherAlertDTO]:
        entities = self.repo.list_by_user_id(user_id)
        return [weather_notification_to_dto(entity) for entity in entities]
