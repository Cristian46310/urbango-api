import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI

from app.config.settings import settings
from app.pqrs.infrastructure.agents.notification_graph import LangGraphNotificationOrchestrator
from app.pqrs.infrastructure.repositories.pqrs_repository import PqrsRepository
from app.scheduler.infrastructure.database import get_connection
from app.weather.infrastructure.agents.weather_notification_graph import LangGraphWeatherNotificationOrchestrator
from app.weather.infrastructure.clients.openweather_client import OpenWeatherClient
from app.weather.infrastructure.repositories.weather_notification_repository import WeatherNotificationRepository

logger = logging.getLogger(__name__)


async def _run_sla_check() -> None:
    conn = None
    try:
        conn = get_connection()
        repo = PqrsRepository(conn)
        orchestrator = LangGraphNotificationOrchestrator()
        overdue = repo.list_overdue_pqrs()
        for pqrs in overdue:
            try:
                orchestrator.notify_sla_breach(pqrs)
                repo.mark_sla_alert_sent(pqrs.id)
                conn.commit()
            except Exception as exc:
                logger.warning("SLA alert failed for %s: %s", pqrs.ticket_number, exc)
                conn.rollback()
    except Exception as exc:
        logger.warning("SLA checker failed: %s", exc)
    finally:
        if conn:
            conn.close()


async def _sla_loop() -> None:
    while True:
        await _run_sla_check()
        await asyncio.sleep(settings.SLA_CHECK_INTERVAL_SECONDS)


async def _run_weather_check() -> None:
    conn = None
    try:
        tz = ZoneInfo(settings.TIMEZONE)
        now = datetime.now(tz)
        conn = get_connection()
        repo = WeatherNotificationRepository(conn)
        weather_provider = OpenWeatherClient()
        orchestrator = LangGraphWeatherNotificationOrchestrator()
        due = repo.list_due_for_hour(
            now.hour,
            now.date(),
            settings.WEATHER_ALERT_MAX_HOURS_BEFORE,
        )
        for subscription in due:
            try:
                forecast = weather_provider.get_daily_forecast(
                    subscription.city_lat,
                    subscription.city_lon,
                    subscription.travel_hour,
                )
                orchestrator.notify_weather_alert(subscription, forecast)
                repo.mark_alert_sent(subscription.id, now)
                conn.commit()
            except Exception as exc:
                logger.warning(
                    "Weather alert failed for user %s: %s",
                    subscription.user_id,
                    exc,
                )
                conn.rollback()
    except Exception as exc:
        logger.warning("Weather checker failed: %s", exc)
    finally:
        if conn:
            conn.close()


async def _weather_loop() -> None:
    while True:
        await _run_weather_check()
        await asyncio.sleep(settings.WEATHER_CHECK_INTERVAL_SECONDS)


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    sla_task = asyncio.create_task(_sla_loop())
    weather_task = asyncio.create_task(_weather_loop())
    logger.info(
        "Background jobs started (sla_interval=%ss, weather_interval=%ss)",
        settings.SLA_CHECK_INTERVAL_SECONDS,
        settings.WEATHER_CHECK_INTERVAL_SECONDS,
    )
    try:
        yield
    finally:
        for task in (sla_task, weather_task):
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("Background jobs stopped")
