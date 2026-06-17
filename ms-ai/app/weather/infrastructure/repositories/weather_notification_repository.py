from datetime import date, datetime
from typing import Any

import psycopg2.extensions

from app.config.settings import settings
from app.weather.domain.entities.notification_channel import NotificationChannel
from app.weather.domain.entities.weather_notification import WeatherNotification
from app.weather.domain.ports.iweather_notification_repository import IWeatherNotificationRepository


def _row_to_entity(row: dict[str, Any]) -> WeatherNotification:
    return WeatherNotification(
        id=str(row["id"]),
        user_id=row["user_id"] or "",
        user_email=row["user_email"],
        travel_hour=int(row["travel_hour"]),
        city_name=row["city_name"],
        city_lat=float(row["city_lat"]),
        city_lon=float(row["city_lon"]),
        preferred_channel=NotificationChannel(row["preferred_channel"]),
        is_active=bool(row["is_active"]),
        last_alert_sent_at=row.get("last_alert_sent_at"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


class WeatherNotificationRepository(IWeatherNotificationRepository):
    def __init__(self, conn: psycopg2.extensions.connection) -> None:
        self.conn = conn

    def create(self, notification: WeatherNotification) -> WeatherNotification:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO weather_notifications (
                    id, user_id, user_email, travel_hour, city_name,
                    city_lat, city_lon, preferred_channel, is_active,
                    last_alert_sent_at, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    notification.id,
                    notification.user_id,
                    notification.user_email,
                    notification.travel_hour,
                    notification.city_name,
                    notification.city_lat,
                    notification.city_lon,
                    notification.preferred_channel.value,
                    notification.is_active,
                    notification.last_alert_sent_at,
                    notification.created_at,
                    notification.updated_at,
                ),
            )
            row = cur.fetchone()
        return _row_to_entity(row)

    def update(self, notification: WeatherNotification) -> WeatherNotification:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE weather_notifications
                SET user_email = %s,
                    travel_hour = %s,
                    city_name = %s,
                    city_lat = %s,
                    city_lon = %s,
                    preferred_channel = %s,
                    is_active = %s,
                    updated_at = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    notification.user_email,
                    notification.travel_hour,
                    notification.city_name,
                    notification.city_lat,
                    notification.city_lon,
                    notification.preferred_channel.value,
                    notification.is_active,
                    notification.updated_at,
                    notification.id,
                ),
            )
            row = cur.fetchone()
        if not row:
            raise ValueError("Weather alert not found")
        return _row_to_entity(row)

    def get_by_id(self, alert_id: str) -> WeatherNotification | None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM weather_notifications WHERE id = %s", (alert_id,))
            row = cur.fetchone()
        return _row_to_entity(row) if row else None

    def list_by_user_id(self, user_id: str) -> list[WeatherNotification]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM weather_notifications
                WHERE user_id = %s
                ORDER BY travel_hour ASC, created_at ASC
                """,
                (user_id,),
            )
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def deactivate_by_id(self, alert_id: str) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE weather_notifications
                SET is_active = FALSE, updated_at = NOW()
                WHERE id = %s
                RETURNING id
                """,
                (alert_id,),
            )
            row = cur.fetchone()
        return row is not None

    def list_due_for_hour(
        self,
        current_hour: int,
        today: date,
        max_hours_before: int,
    ) -> list[WeatherNotification]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM weather_notifications
                WHERE is_active = TRUE
                  AND ((travel_hour - %s + 24) %% 24) BETWEEN 1 AND %s
                  AND (
                      last_alert_sent_at IS NULL
                      OR DATE(last_alert_sent_at AT TIME ZONE %s) < %s
                  )
                """,
                (current_hour, max_hours_before, settings.TIMEZONE, today),
            )
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def mark_alert_sent(self, notification_id: str, sent_at: datetime) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE weather_notifications
                SET last_alert_sent_at = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (sent_at, notification_id),
            )
