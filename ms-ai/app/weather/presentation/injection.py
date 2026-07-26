from functools import lru_cache

import psycopg2.extensions
from fastapi import Depends

from app.scheduler.infrastructure.database import get_db
from app.weather.application.use_cases.assess_weather import AssessWeatherUseCase
from app.weather.application.use_cases.create_weather_alert import CreateWeatherAlertUseCase
from app.weather.application.use_cases.deactivate_weather_alert import DeactivateWeatherAlertUseCase
from app.weather.application.use_cases.get_weather_alert import GetWeatherAlertUseCase
from app.weather.application.use_cases.list_weather_alerts_by_user import ListWeatherAlertsByUserUseCase
from app.weather.application.use_cases.update_weather_alert import UpdateWeatherAlertUseCase
from app.weather.infrastructure.agents.weather_assess_graph import LangGraphWeatherInterpreter
from app.weather.infrastructure.clients.openweather_client import OpenWeatherClient
from app.weather.infrastructure.repositories.weather_notification_repository import (
    WeatherNotificationRepository,
)


@lru_cache
def _get_weather_provider() -> OpenWeatherClient:
    return OpenWeatherClient()


def get_weather_provider() -> OpenWeatherClient:
    return _get_weather_provider()


@lru_cache
def _get_weather_interpreter() -> LangGraphWeatherInterpreter:
    return LangGraphWeatherInterpreter()


def get_assess_weather() -> AssessWeatherUseCase:
    return AssessWeatherUseCase(
        weather_provider=_get_weather_provider(),
        interpreter=_get_weather_interpreter(),
    )


def get_create_weather_alert(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> CreateWeatherAlertUseCase:
    return CreateWeatherAlertUseCase(
        repo=WeatherNotificationRepository(conn),
        weather_provider=_get_weather_provider(),
    )


def get_update_weather_alert(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> UpdateWeatherAlertUseCase:
    return UpdateWeatherAlertUseCase(
        repo=WeatherNotificationRepository(conn),
        weather_provider=_get_weather_provider(),
    )


def get_list_weather_alerts_by_user(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> ListWeatherAlertsByUserUseCase:
    return ListWeatherAlertsByUserUseCase(WeatherNotificationRepository(conn))


def get_weather_alert(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetWeatherAlertUseCase:
    return GetWeatherAlertUseCase(WeatherNotificationRepository(conn))


def get_deactivate_weather_alert(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> DeactivateWeatherAlertUseCase:
    return DeactivateWeatherAlertUseCase(WeatherNotificationRepository(conn))
