from datetime import datetime
from typing import Any

from app.scheduler.domain.entities.calendar import CalendarEvent


def gcal_event_to_entity(event: dict[str, Any]) -> CalendarEvent:
    start_raw = event.get("start", {})
    end_raw = event.get("end", {})

    start_str = start_raw.get("dateTime") or start_raw.get("date", "")
    end_str = end_raw.get("dateTime") or end_raw.get("date", "")

    start_dt = datetime.fromisoformat(start_str) if start_str else datetime.now()
    end_dt = datetime.fromisoformat(end_str) if end_str else datetime.now()

    return CalendarEvent(
        id=event.get("id", ""),
        start_date=start_dt,
        end_date=end_dt,
        description=event.get("description", ""),
        location=event.get("location", ""),
    )
