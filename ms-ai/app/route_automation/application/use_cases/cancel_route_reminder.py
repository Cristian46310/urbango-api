from datetime import datetime

from app.route_automation.domain.entities.route_reminder import ReminderSyncStatus
from app.route_automation.domain.ports.iroute_reminder_repository import IRouteReminderRepository
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository


class CancelRouteReminderUseCase:
    def __init__(
        self,
        calendar: ICalendarRepository,
        reminder_repo: IRouteReminderRepository,
    ) -> None:
        self.calendar = calendar
        self.reminder_repo = reminder_repo

    def execute(self, reminder_id: str) -> dict:
        reminder = self.reminder_repo.get_by_id(reminder_id)
        if not reminder:
            raise ValueError("Route reminder not found")

        if reminder.calendar_event_id:
            try:
                self.calendar.cancel_calendar_event(reminder.calendar_event_id)
            except Exception as exc:
                self.reminder_repo.update_sync(
                    reminder.id,
                    sync_status=ReminderSyncStatus.FAILED,
                    last_error=f"Cancel failed: {exc}"[:500],
                )
                raise ValueError(f"Failed to cancel calendar event: {exc}") from exc

        updated = self.reminder_repo.update_sync(
            reminder.id,
            sync_status=ReminderSyncStatus.CANCELLED,
            last_error=None,
        )
        return {
            "reminder_id": updated.id,
            "sync_status": updated.sync_status.value,
            "updated_at": datetime.now().isoformat(),
        }
