from typing import Optional, Protocol

from app.route_automation.domain.entities.route_reminder import ReminderSyncStatus, RouteReminder


class IRouteReminderRepository(Protocol):
    def find_by_schedule_and_email(
        self, business_schedule_id: str, user_email: str
    ) -> Optional[RouteReminder]: ...

    def get_by_id(self, reminder_id: str) -> Optional[RouteReminder]: ...

    def save(self, reminder: RouteReminder) -> RouteReminder: ...

    def update_sync(
        self,
        reminder_id: str,
        *,
        sync_status: ReminderSyncStatus,
        calendar_event_id: str | None = None,
        last_error: str | None = None,
    ) -> RouteReminder: ...
