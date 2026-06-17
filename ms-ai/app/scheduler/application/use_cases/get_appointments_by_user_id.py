from datetime import datetime
from typing import List, Optional

from app.scheduler.application.dto.appointment_dto import AppointmentDTO
from app.scheduler.application.mappers.appointment_mapper import appointment_to_dto
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository


class GetAppointmentsByUserIdUseCase:
    def __init__(self, appointment_repo: IAppointmentRepository) -> None:
        self.appointment_repo = appointment_repo

    def execute(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[AppointmentDTO]:
        appointments = self.appointment_repo.get_appointments_by_user_id(user_id, start_date, end_date)
        return [appointment_to_dto(a) for a in appointments]
