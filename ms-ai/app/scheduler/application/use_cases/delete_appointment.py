from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository
from app.scheduler.domain.ports.inotification_port import INotificationPort


class DeleteAppointmentUseCase:
    def __init__(
        self,
        appointment_repo: IAppointmentRepository,
        calendar_repo: ICalendarRepository,
        notification_port: INotificationPort,
    ) -> None:
        self.appointment_repo = appointment_repo
        self.calendar_repo = calendar_repo
        self.notification_port = notification_port

    def execute(self, id: str) -> None:
        appointment = self.appointment_repo.get_appointment_by_id(id)

        if appointment.calendar_event_id:
            self.calendar_repo.cancel_calendar_event(appointment.calendar_event_id)

        self.notification_port.send_cancellation(appointment)
        self.appointment_repo.delete_appointment(id)
