from datetime import datetime
from typing import List, Protocol
from app.scheduler.domain.entities.calendar import CalendarEvent

class ICalendarRepository(Protocol):
    def create_calendar_event(self, start_date: datetime, end_date: datetime, description: str, location: str) -> CalendarEvent:
        ...

    def get_calendar_events_by_date_range(self, start_date: datetime, end_date: datetime) -> List[CalendarEvent]:
        ...

    def update_calendar_event(self, calendar_event_id: str, start_date: datetime, end_date: datetime, description: str, location: str) -> CalendarEvent:
        ...

    def cancel_calendar_event(self, calendar_event_id: str) -> None:
        ...