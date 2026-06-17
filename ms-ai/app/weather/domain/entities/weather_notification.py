from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field

from app.weather.domain.entities.notification_channel import NotificationChannel


class WeatherNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(default="")
    user_email: str = Field(default="")
    travel_hour: int = Field(default=7, ge=0, le=23)
    city_name: str = Field(default="")
    city_lat: float = Field(default=0.0)
    city_lon: float = Field(default=0.0)
    preferred_channel: NotificationChannel = Field(default=NotificationChannel.EMAIL)
    is_active: bool = Field(default=True)
    last_alert_sent_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
