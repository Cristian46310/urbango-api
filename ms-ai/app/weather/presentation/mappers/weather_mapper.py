from app.weather.application.dto.weather_alert_dto import WeatherAlertDTO
from app.weather.presentation.schemas.weather_schema import WeatherAlertResponse


def dto_to_response(dto: WeatherAlertDTO) -> WeatherAlertResponse:
    return WeatherAlertResponse(
        id=dto.id,
        user_id=dto.user_id,
        user_email=dto.user_email,
        travel_hour=dto.travel_hour,
        city_name=dto.city_name,
        city_lat=dto.city_lat,
        city_lon=dto.city_lon,
        preferred_channel=dto.preferred_channel,
        is_active=dto.is_active,
        last_alert_sent_at=dto.last_alert_sent_at,
        created_at=dto.created_at,
        updated_at=dto.updated_at,
    )
