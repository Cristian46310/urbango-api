from app.weather.domain.ports.iweather_notification_repository import IWeatherNotificationRepository


class DeactivateWeatherAlertUseCase:
    def __init__(self, repo: IWeatherNotificationRepository) -> None:
        self.repo = repo

    def execute(self, alert_id: str) -> bool:
        return self.repo.deactivate_by_id(alert_id)
