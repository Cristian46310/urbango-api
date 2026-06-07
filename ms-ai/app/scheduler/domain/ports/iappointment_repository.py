
from datetime import datetime
from typing import List, Protocol
from app.scheduler.domain.entities.appoitment import Appointment


class IAppointmentRepository(Protocol):

    def create_appointment(self, appointment: Appointment) -> Appointment:
        ...

    def get_appointment_by_id(self, id: str) -> Appointment:
        ...

    def get_all_appointments(self) -> List[Appointment]:
        ...

    def get_appointments_by_user_id(self, user_id: str, start_date: datetime | None = None, end_date: datetime | None = None) -> List[Appointment]:
        ...
    
    def update_appointment(self, appointment: Appointment) -> Appointment:
        ...
    
    def delete_appointment(self, id: str) -> None:
        ...