from datetime import datetime
from typing import Any

from app.scheduler.domain.entities.calendar import CalendarEvent


def _extract_location(event: dict[str, Any]) -> str:
    if event.get("hangoutLink"):
        return event["hangoutLink"]

    conference = event.get("conferenceData", {})
    for entry_point in conference.get("entryPoints", []):
        if entry_point.get("entryPointType") == "video":
            return entry_point.get("uri", "")

    return event.get("location", "")


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
        location=_extract_location(event),
    )
