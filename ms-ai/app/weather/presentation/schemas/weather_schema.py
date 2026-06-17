from datetime import datetime

from pydantic import BaseModel, Field

from app.weather.domain.entities.notification_channel import NotificationChannel


class CreateWeatherAlertRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    user_email: str = Field(..., min_length=3)
    travel_hour: int = Field(..., ge=0, le=23, description="Horario habitual de viaje (0-23)")
    city_name: str = Field(..., min_length=2, description="Ciudad para el pronóstico, ej. Manizales,CO")
    preferred_channel: NotificationChannel = Field(
        default=NotificationChannel.EMAIL,
        description="Canal preferido: email, whatsapp o push",
    )


class UpdateWeatherAlertRequest(BaseModel):
    user_email: str = Field(..., min_length=3)
    travel_hour: int = Field(..., ge=0, le=23, description="Horario habitual de viaje (0-23)")
    city_name: str = Field(..., min_length=2, description="Ciudad para el pronóstico, ej. Manizales,CO")
    preferred_channel: NotificationChannel = Field(
        default=NotificationChannel.EMAIL,
        description="Canal preferido: email, whatsapp o push",
    )


class WeatherAlertResponse(BaseModel):
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
