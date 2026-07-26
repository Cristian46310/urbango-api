from datetime import date, datetime
from typing import Any

from app.config.settings import settings
from app.infrastructure.integrations.common.http_client import build_headers, get_json
from app.infrastructure.integrations.common.http_errors import IntegrationNotFound
from app.route_automation.domain.ports.ibusiness_transport_query_port import (
    IBusinessTransportQueryPort,
    RouteSchedule,
)

DEPENDENCY = "ms-business"


class HttpBusinessTransportClient(IBusinessTransportQueryPort):
    """Maps ms-business JSON to ms-ai projections. No shared DTO package."""

    def __init__(self, base_url: str | None = None, internal_key: str | None = None) -> None:
        self.base_url = (base_url or settings.MS_BUSINESS_URL).rstrip("/")
        self.internal_key = (
            internal_key if internal_key is not None else settings.MS_BUSINESS_INTERNAL_KEY
        )

    def list_schedules(
        self,
        *,
        on_date: date | None = None,
        route_id: str | None = None,
        status: str = "programado",
        page: int = 1,
        limit: int = 50,
    ) -> list[RouteSchedule]:
        params: dict[str, Any] = {"page": page, "limit": limit, "status": status}
        if on_date:
            params["date"] = on_date.isoformat()
        if route_id:
            params["routeId"] = route_id

        data = get_json(
            f"{self.base_url}/internal/v1/scheduler",
            dependency=DEPENDENCY,
            params=params,
            headers=build_headers(internal_key=self.internal_key or None),
        )
        items = data.get("items", []) if isinstance(data, dict) else data
        return [self._map_item(item) for item in items]

    def get_schedule_by_id(self, schedule_id: str) -> RouteSchedule | None:
        try:
            data = get_json(
                f"{self.base_url}/internal/v1/scheduler/{schedule_id}",
                dependency=DEPENDENCY,
                headers=build_headers(internal_key=self.internal_key or None),
            )
            return self._map_item(data)
        except IntegrationNotFound:
            return None

    @staticmethod
    def _map_item(item: dict) -> RouteSchedule:
        route = item.get("route") or {}
        bus = item.get("bus") or {}
        return RouteSchedule(
            id=str(item["id"]),
            route_id=str(route.get("id") or ""),
            route_name=str(route.get("name") or ""),
            route_code=str(route.get("code") or ""),
            bus_plate=str(bus.get("plate") or bus.get("licensePlate") or ""),
            schedule_date=str(item.get("date") or ""),
            departure_time=_parse_dt(item.get("departureTime") or item.get("startTime")),
            end_time=_parse_dt(item["endTime"]),
            status=str(item.get("status") or "programado"),
        )


def _parse_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    text = str(value).replace("Z", "+00:00")
    return datetime.fromisoformat(text)
