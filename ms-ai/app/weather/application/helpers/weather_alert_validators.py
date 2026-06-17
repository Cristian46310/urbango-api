import re

from app.weather.domain.entities.notification_channel import NotificationChannel


def validate_email(email: str) -> None:
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise ValueError("Invalid email address")


def validate_travel_hour(travel_hour: int) -> None:
    if not 0 <= travel_hour <= 23:
        raise ValueError("travel_hour must be between 0 and 23")


def validate_user_id(user_id: str) -> None:
    if not user_id.strip():
        raise ValueError("user_id is required")
