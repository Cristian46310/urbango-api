from app.scheduler.domain.entities.appoitment import Appointment
from app.scheduler.application.dto.appointment_dto import AppointmentDTO


def appointment_to_dto(appointment: Appointment) -> AppointmentDTO:
    return AppointmentDTO(
        id=appointment.id,
        calendar_event_id=appointment.calendar_event_id,
        type=appointment.type,
        reason=appointment.reason,
        date_time=appointment.date_time,
        description=appointment.description,
        location=appointment.location,
        user_id=appointment.user_id,
        user_email=appointment.user_email,
        created_at=appointment.created_at,
    )
