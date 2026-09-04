from datetime import date, datetime
from typing import Protocol

from pydantic import BaseModel, Field


class RouteSchedule(BaseModel):
    """Minimal projection of ms-business scheduler. Not a shared DTO package."""

    id: str
    route_id: str = ""
    route_name: str = ""
    route_code: str = ""
    bus_plate: str = ""
    schedule_date: str = ""
    departure_time: datetime
    end_time: datetime
    status: str = "programado"


class IBusinessTransportQueryPort(Protocol):
    """Read-only transport queries against ms-business. Expandable without new HTTP clients."""

    def list_schedules(
        self,
        *,
        on_date: date | None = None,
        route_id: str | None = None,
        status: str = "programado",
        page: int = 1,
        limit: int = 50,
    ) -> list[RouteSchedule]: ...

    def get_schedule_by_id(self, schedule_id: str) -> RouteSchedule | None: ...
