from datetime import datetime

import httpx

from app.config.settings import settings
from app.route_automation.domain.entities.route_reminder import ReminderSyncStatus, RouteReminder
from app.route_automation.domain.ports.ibusiness_transport_query_port import (
    IBusinessTransportQueryPort,
    RouteSchedule,
)
from app.route_automation.domain.ports.iroute_reminder_repository import IRouteReminderRepository
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository


class CreateRouteReminderUseCase:
    def __init__(
        self,
        business: IBusinessTransportQueryPort,
        calendar: ICalendarRepository,
        reminder_repo: IRouteReminderRepository,
    ) -> None:
        self.business = business
        self.calendar = calendar
        self.reminder_repo = reminder_repo

    def execute(
        self,
        business_schedule_id: str,
        user_id: str,
        user_email: str,
    ) -> dict:
        if "@" not in user_email:
            raise ValueError("Invalid user_email")

        existing = self.reminder_repo.find_by_schedule_and_email(
            business_schedule_id, user_email
        )
        if existing and existing.sync_status == ReminderSyncStatus.SYNCED:
            schedule = self.business.get_schedule_by_id(business_schedule_id)
            return self._response(existing, schedule)

        schedule = self.business.get_schedule_by_id(business_schedule_id)
        if not schedule:
            raise ValueError("Route schedule not found in ms-business")

        reminder = existing or RouteReminder(
            business_schedule_id=business_schedule_id,
            user_id=user_id,
            user_email=user_email,
            sync_status=ReminderSyncStatus.PENDING,
        )
        reminder.user_id = user_id
        reminder.user_email = user_email
        reminder.sync_status = ReminderSyncStatus.PENDING
        reminder.last_error = None
        reminder.updated_at = datetime.now()
        reminder = self.reminder_repo.save(reminder)

        try:
            event = self.calendar.create_calendar_event(
                start_date=schedule.departure_time,
                end_date=schedule.end_time,
                description=(
                    f"Recordatorio ruta {schedule.route_code} - {schedule.route_name}. "
                    f"Bus: {schedule.bus_plate}"
                ),
                location=schedule.route_name,
                summary=f"Salida {schedule.route_name}",
                attendee_email=user_email,
                virtual=False,
            )
            reminder = self.reminder_repo.update_sync(
                reminder.id,
                sync_status=ReminderSyncStatus.SYNCED,
                calendar_event_id=event.id,
                last_error=None,
            )
            self._send_email(user_email, schedule)
        except Exception as exc:
            reminder = self.reminder_repo.update_sync(
                reminder.id,
                sync_status=ReminderSyncStatus.FAILED,
                last_error=str(exc)[:500],
            )
            raise ValueError(f"Failed to sync calendar reminder: {exc}") from exc

        return self._response(reminder, schedule)

    @staticmethod
    def _response(reminder: RouteReminder, schedule: RouteSchedule | None) -> dict:
        return {
            "reminder_id": reminder.id,
            "calendar_event_id": reminder.calendar_event_id,
            "sync_status": reminder.sync_status.value,
            "departure_time": schedule.departure_time.isoformat() if schedule else None,
            "route_name": schedule.route_name if schedule else "",
            "last_error": reminder.last_error,
        }

    @staticmethod
    def _send_email(user_email: str, schedule: RouteSchedule) -> None:
        body = (
            f"Hola,\n\n"
            f"Se creó un recordatorio para la salida de la ruta {schedule.route_name} "
            f"({schedule.route_code}).\n"
            f"Salida: {schedule.departure_time.isoformat()}\n"
            f"Bus: {schedule.bus_plate or 'N/D'}\n\n"
        )
        try:
            httpx.post(
                settings.MS_NOTIFICATION_URL,
                json={
                    "to": user_email,
                    "subject": f"Recordatorio ruta {schedule.route_name}",
                    "body": body,
                },
                timeout=10.0,
            )
        except Exception:
            pass
