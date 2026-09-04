from functools import lru_cache

import psycopg2.extensions
from fastapi import Depends

from app.infrastructure.integrations.business.http_business_transport_client import (
    HttpBusinessTransportClient,
)
from app.route_automation.application.use_cases.cancel_route_reminder import (
    CancelRouteReminderUseCase,
)
from app.route_automation.application.use_cases.create_route_reminder import (
    CreateRouteReminderUseCase,
)
from app.route_automation.infrastructure.repositories.route_reminder_repository import (
    RouteReminderRepository,
)
from app.scheduler.infrastructure.database import get_db
from app.scheduler.infrastructure.provider.google_calendar import GoogleCalendarProvider


@lru_cache
def _get_business_client() -> HttpBusinessTransportClient:
    return HttpBusinessTransportClient()


@lru_cache
def _get_calendar() -> GoogleCalendarProvider:
    return GoogleCalendarProvider()


def get_create_route_reminder(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> CreateRouteReminderUseCase:
    return CreateRouteReminderUseCase(
        business=_get_business_client(),
        calendar=_get_calendar(),
        reminder_repo=RouteReminderRepository(conn),
    )


def get_cancel_route_reminder(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> CancelRouteReminderUseCase:
    return CancelRouteReminderUseCase(
        calendar=_get_calendar(),
        reminder_repo=RouteReminderRepository(conn),
    )
