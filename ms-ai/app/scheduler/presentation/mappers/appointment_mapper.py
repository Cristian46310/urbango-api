from app.scheduler.application.dto.appointment_dto import AppointmentDTO, SlotDTO
from app.scheduler.presentation.schemas.appointment_schema import AppointmentResponse, SlotResponse


def dto_to_response(dto: AppointmentDTO) -> AppointmentResponse:
    return AppointmentResponse(
        id=dto.id,
        calendar_event_id=dto.calendar_event_id,
        type=dto.type,
        reason=dto.reason,
        date_time=dto.date_time,
        description=dto.description,
        location=dto.location,
        user_id=dto.user_id,
        user_email=dto.user_email,
        created_at=dto.created_at,
    )


def slot_dto_to_response(slot: SlotDTO) -> SlotResponse:
    return SlotResponse(start=slot.start, end=slot.end)
