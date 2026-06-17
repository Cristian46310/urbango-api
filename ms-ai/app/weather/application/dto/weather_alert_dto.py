from datetime import datetime

from pydantic import BaseModel

from app.weather.domain.entities.notification_channel import NotificationChannel


class WeatherAlertDTO(BaseModel):
    id: str
    user_id: str
    user_email: str
    travel_hour: int
    city_name: str
    city_lat: float
    city_lon: float
    preferred_channel: NotificationChannel
    is_active: bool
    last_alert_sent_at: datetime | None
    created_at: datetime
    updated_at: datetime
