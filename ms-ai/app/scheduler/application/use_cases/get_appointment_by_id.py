from app.scheduler.application.dto.appointment_dto import AppointmentDTO
from app.scheduler.application.mappers.appointment_mapper import appointment_to_dto
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository


class GetAppointmentByIdUseCase:
    def __init__(self, appointment_repo: IAppointmentRepository) -> None:
        self.appointment_repo = appointment_repo

    def execute(self, id: str) -> AppointmentDTO:
        appointment = self.appointment_repo.get_appointment_by_id(id)
        return appointment_to_dto(appointment)
