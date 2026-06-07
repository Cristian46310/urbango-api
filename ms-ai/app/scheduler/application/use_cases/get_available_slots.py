from datetime import datetime, timedelta, timezone
from typing import List
from zoneinfo import ZoneInfo

from app.config.settings import settings
from app.scheduler.application.dto.appointment_dto import SlotDTO
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository


class GetAvailableSlotsUseCase:
    def __init__(self, calendar_repo: ICalendarRepository) -> None:
        self.calendar_repo = calendar_repo

    def execute(self, days: int | None = None, start_date: datetime | None = None) -> List[SlotDTO]:
        days = days or settings.AVAILABILITY_DAYS
        tz = ZoneInfo(settings.TIMEZONE)
        now = datetime.now(tz)
        range_start = start_date.astimezone(tz) if start_date else now.replace(
            hour=settings.BUSINESS_HOUR_START, minute=0, second=0, microsecond=0
        )
        range_end = range_start + timedelta(days=days)

        busy_events = self.calendar_repo.get_calendar_events_by_date_range(range_start, range_end)

        slots: List[SlotDTO] = []
        slot_delta = timedelta(minutes=settings.SLOT_DURATION_MINUTES)

        cursor = range_start
        while cursor < range_end:
            # Skip weekends (Mon=0 … Sun=6)
            if cursor.weekday() >= 5:
                cursor = (cursor + timedelta(days=1)).replace(
                    hour=settings.BUSINESS_HOUR_START, minute=0, second=0, microsecond=0
                )
                continue

            day_start = cursor.replace(hour=settings.BUSINESS_HOUR_START, minute=0, second=0, microsecond=0)
            day_end = cursor.replace(hour=settings.BUSINESS_HOUR_END, minute=0, second=0, microsecond=0)

            slot_start = max(cursor, day_start)
            while slot_start + slot_delta <= day_end:
                slot_end = slot_start + slot_delta

                # Skip slots in the past
                if slot_end <= now:
                    slot_start = slot_end
                    continue

                if not self._overlaps_busy(slot_start, slot_end, busy_events):
                    slots.append(SlotDTO(start=slot_start, end=slot_end))

                slot_start = slot_end

            cursor = (cursor + timedelta(days=1)).replace(
                hour=settings.BUSINESS_HOUR_START, minute=0, second=0, microsecond=0
            )

        return slots

    @staticmethod
    def _overlaps_busy(slot_start: datetime, slot_end: datetime, busy_events) -> bool:
        for event in busy_events:
            ev_start = event.start_date
            ev_end = event.end_date
            # Normalise to aware if needed
            if ev_start.tzinfo is None:
                ev_start = ev_start.replace(tzinfo=timezone.utc)
            if ev_end.tzinfo is None:
                ev_end = ev_end.replace(tzinfo=timezone.utc)
            if ev_start < slot_end and ev_end > slot_start:
                return True
        return False
