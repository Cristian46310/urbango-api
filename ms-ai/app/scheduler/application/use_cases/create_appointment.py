from datetime import datetime, timedelta, timezone
from typing import Optional

from app.config.settings import settings
from app.scheduler.application.dto.appointment_dto import AppointmentDTO
from app.scheduler.application.mappers.appointment_mapper import appointment_to_dto
from app.scheduler.application.use_cases.get_available_slots import GetAvailableSlotsUseCase
from app.scheduler.domain.entities.appoitment import Appointment, AppointmentType, AppointmentReason
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository
from app.scheduler.domain.ports.inotification_port import INotificationPort


class CreateAppointmentUseCase:
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
        type: AppointmentType,
        reason: AppointmentReason,
        date_time: datetime,
        description: str,
        user_id: str,
        user_email: str,
    ) -> AppointmentDTO:
        slot_checker = GetAvailableSlotsUseCase(self.calendar_repo)
        slot_end = date_time + timedelta(minutes=settings.SLOT_DURATION_MINUTES)
        busy_events = self.calendar_repo.get_calendar_events_by_date_range(date_time, slot_end)

        start_tz = date_time if date_time.tzinfo else date_time.replace(tzinfo=timezone.utc)
        end_tz = slot_end if slot_end.tzinfo else slot_end.replace(tzinfo=timezone.utc)

        if slot_checker._overlaps_busy(start_tz, end_tz, busy_events):
            raise ValueError("The selected time slot is not available")

        virtual = type == AppointmentType.VIRTUAL
        location = settings.OFFICE_LOCATION if not virtual else "https://meet.google.com"

        from app.scheduler.infrastructure.provider.google_calendar import GoogleCalendarProvider
        if isinstance(self.calendar_repo, GoogleCalendarProvider):
            calendar_event = self.calendar_repo.create_calendar_event(
                start_date=date_time,
                end_date=slot_end,
                description=description,
                location=location,
                summary=f"Cita UCaldas - {reason.value}",
                attendee_email=user_email,
                virtual=virtual,
            )
        else:
            calendar_event = self.calendar_repo.create_calendar_event(
                start_date=date_time,
                end_date=slot_end,
                description=description,
                location=location,
            )

        # If virtual, use the Meet link from the calendar event if available
        if virtual and calendar_event.location:
            location = calendar_event.location

        appointment = Appointment(
            type=type,
            reason=reason,
            date_time=date_time,
            description=description,
            location=location,
            user_id=user_id,
            user_email=user_email,
            calendar_event_id=calendar_event.id,
        )
        saved = self.appointment_repo.create_appointment(appointment)
        self.notification_port.send_confirmation(saved)
        return appointment_to_dto(saved)
