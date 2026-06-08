from datetime import datetime, timedelta, timezone
from typing import Optional

from app.config.settings import settings
from app.scheduler.application.dto.appointment_dto import AppointmentDTO
from app.scheduler.application.mappers.appointment_mapper import appointment_to_dto
from app.scheduler.application.use_cases.get_available_slots import GetAvailableSlotsUseCase
from app.scheduler.domain.entities.appoitment import AppointmentType, AppointmentReason
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository
from app.scheduler.domain.ports.inotification_port import INotificationPort


class UpdateAppointmentUseCase:
    def __init__(
        self,
        appointment_repo: IAppointmentRepository,
        calendar_repo: ICalendarRepository,
        notification_port: INotificationPort,
    ) -> None:
        self.appointment_repo = appointment_repo
        self.calendar_repo = calendar_repo
        self.notification_port = notification_port

    def execute(
        self,
        id: str,
        type: Optional[AppointmentType] = None,
        reason: Optional[AppointmentReason] = None,
        date_time: Optional[datetime] = None,
        description: Optional[str] = None,
    ) -> AppointmentDTO:
        existing = self.appointment_repo.get_appointment_by_id(id)

        new_date_time = date_time or existing.date_time
        new_type = type or existing.type
        new_reason = reason or existing.reason
        new_description = description if description is not None else existing.description
        virtual = new_type == AppointmentType.VIRTUAL

        if date_time and date_time != existing.date_time:
            slot_end = new_date_time + timedelta(minutes=settings.SLOT_DURATION_MINUTES)
            start_tz = new_date_time if new_date_time.tzinfo else new_date_time.replace(tzinfo=timezone.utc)
            end_tz = slot_end if slot_end.tzinfo else slot_end.replace(tzinfo=timezone.utc)
            busy_events = self.calendar_repo.get_calendar_events_by_date_range(start_tz, end_tz)

            checker = GetAvailableSlotsUseCase(self.calendar_repo)
            if checker._overlaps_busy(start_tz, end_tz, busy_events):
                raise ValueError("The selected time slot is not available")

        new_location = existing.location
        if existing.calendar_event_id:
            slot_end = new_date_time + timedelta(minutes=settings.SLOT_DURATION_MINUTES)
            updated_event = self.calendar_repo.update_calendar_event(
                calendar_event_id=existing.calendar_event_id,
                start_date=new_date_time,
                end_date=slot_end,
                description=new_description,
                location=settings.OFFICE_LOCATION,
                virtual=virtual,
            )
            new_location = updated_event.location

        updated = existing.model_copy(update={
            "type": new_type,
            "reason": new_reason,
            "date_time": new_date_time,
            "description": new_description,
            "location": new_location,
        })

        changed = (
            new_type != existing.type
            or new_reason != existing.reason
            or new_date_time != existing.date_time
            or new_description != existing.description
            or new_location != existing.location
        )

        saved = self.appointment_repo.update_appointment(updated)
        if changed:
            self.notification_port.send_update(saved)
        return appointment_to_dto(saved)
