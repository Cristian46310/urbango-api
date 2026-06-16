from typing import List

from app.scheduler.application.dto.appointment_dto import AppointmentDTO
from app.scheduler.application.mappers.appointment_mapper import appointment_to_dto
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository


class GetAllAppointmentsUseCase:
    def __init__(self, appointment_repo: IAppointmentRepository) -> None:
        self.appointment_repo = appointment_repo

    def execute(self) -> List[AppointmentDTO]:
        return [appointment_to_dto(a) for a in self.appointment_repo.get_all_appointments()]
