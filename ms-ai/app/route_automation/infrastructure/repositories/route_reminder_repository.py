from datetime import datetime

import psycopg2.extensions

from app.route_automation.domain.entities.route_reminder import ReminderSyncStatus, RouteReminder
from app.route_automation.domain.ports.iroute_reminder_repository import IRouteReminderRepository


class RouteReminderRepository(IRouteReminderRepository):
    def __init__(self, conn: psycopg2.extensions.connection) -> None:
        self.conn = conn

    def find_by_schedule_and_email(
        self, business_schedule_id: str, user_email: str
    ) -> RouteReminder | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM automation_route_reminders
                WHERE business_schedule_id = %s AND user_email = %s
                """,
                (business_schedule_id, user_email),
            )
            row = cur.fetchone()
        return self._to_entity(row) if row else None

    def get_by_id(self, reminder_id: str) -> RouteReminder | None:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM automation_route_reminders WHERE id = %s",
                (reminder_id,),
            )
            row = cur.fetchone()
        return self._to_entity(row) if row else None

    def save(self, reminder: RouteReminder) -> RouteReminder:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO automation_route_reminders (
                    id, business_schedule_id, user_id, user_email,
                    calendar_event_id, sync_status, last_error, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (business_schedule_id, user_email) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    calendar_event_id = EXCLUDED.calendar_event_id,
                    sync_status = EXCLUDED.sync_status,
                    last_error = EXCLUDED.last_error,
                    updated_at = EXCLUDED.updated_at
                RETURNING *
                """,
                (
                    reminder.id,
                    reminder.business_schedule_id,
                    reminder.user_id,
                    reminder.user_email,
                    reminder.calendar_event_id,
                    reminder.sync_status.value,
                    reminder.last_error,
                    reminder.created_at,
                    reminder.updated_at,
                ),
            )
            row = cur.fetchone()
        return self._to_entity(row)

    def update_sync(
        self,
        reminder_id: str,
        *,
        sync_status: ReminderSyncStatus,
        calendar_event_id: str | None = None,
        last_error: str | None = None,
    ) -> RouteReminder:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE automation_route_reminders
                SET sync_status = %s,
                    calendar_event_id = COALESCE(%s, calendar_event_id),
                    last_error = %s,
                    updated_at = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    sync_status.value,
                    calendar_event_id,
                    last_error,
                    datetime.now(),
                    reminder_id,
                ),
            )
            row = cur.fetchone()
        if not row:
            raise ValueError(f"Route reminder not found: {reminder_id}")
        return self._to_entity(row)

    @staticmethod
    def _to_entity(row) -> RouteReminder:
        return RouteReminder(
            id=str(row["id"]),
            business_schedule_id=str(row["business_schedule_id"]),
            user_id=row.get("user_id") or "",
            user_email=row.get("user_email") or "",
            calendar_event_id=row.get("calendar_event_id"),
            sync_status=ReminderSyncStatus(row["sync_status"]),
            last_error=row.get("last_error"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
