from app.weather.application.dto.weather_alert_dto import WeatherAlertDTO
from app.weather.domain.entities.weather_notification import WeatherNotification


def weather_notification_to_dto(entity: WeatherNotification) -> WeatherAlertDTO:
    return WeatherAlertDTO(
        id=entity.id,
        user_id=entity.user_id,
        user_email=entity.user_email,
        travel_hour=entity.travel_hour,
        city_name=entity.city_name,
        city_lat=entity.city_lat,
        city_lon=entity.city_lon,
        preferred_channel=entity.preferred_channel,
        is_active=entity.is_active,
        last_alert_sent_at=entity.last_alert_sent_at,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
    )
