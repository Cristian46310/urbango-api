from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from app.scheduler.domain.entities.appoitment import Appointment, AppointmentType, AppointmentReason
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository
from app.scheduler.infrastructure.repositories.models import AppointmentModel


def _to_entity(model: AppointmentModel) -> Appointment:
    return Appointment(
        id=model.id,
        calendar_event_id=model.calendar_event_id,
        type=AppointmentType(model.type),
        reason=AppointmentReason(model.reason),
        date_time=model.date_time,
        description=model.description,
        location=model.location,
        user_id=model.user_id,
        user_email=model.user_email,
        created_at=model.created_at,
    )


def _to_model(appointment: Appointment) -> AppointmentModel:
    return AppointmentModel(
        id=appointment.id,
        calendar_event_id=appointment.calendar_event_id,
        type=appointment.type.value,
        reason=appointment.reason.value,
        date_time=appointment.date_time,
        description=appointment.description,
        location=appointment.location,
        user_id=appointment.user_id,
        user_email=appointment.user_email,
        created_at=appointment.created_at,
    )


class AppointmentRepository(IAppointmentRepository):
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_appointment(self, appointment: Appointment) -> Appointment:
        model = _to_model(appointment)
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def get_appointment_by_id(self, id: str) -> Appointment:
        model = self.db.query(AppointmentModel).filter(AppointmentModel.id == id).first()
        if not model:
            raise ValueError(f"Appointment {id} not found")
        return _to_entity(model)

    def get_all_appointments(self) -> List[Appointment]:
        return [_to_entity(m) for m in self.db.query(AppointmentModel).all()]

    def get_appointments_by_user_id(
        self,
        user_id: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> List[Appointment]:
        q = self.db.query(AppointmentModel).filter(AppointmentModel.user_id == user_id)
        if start_date:
            q = q.filter(AppointmentModel.date_time >= start_date)
        if end_date:
            q = q.filter(AppointmentModel.date_time <= end_date)
        return [_to_entity(m) for m in q.all()]

    def update_appointment(self, appointment: Appointment) -> Appointment:
        model = self.db.query(AppointmentModel).filter(AppointmentModel.id == appointment.id).first()
        if not model:
            raise ValueError(f"Appointment {appointment.id} not found")
        model.calendar_event_id = appointment.calendar_event_id
        model.type = appointment.type.value
        model.reason = appointment.reason.value
        model.date_time = appointment.date_time
        model.description = appointment.description
        model.location = appointment.location
        model.user_id = appointment.user_id
        model.user_email = appointment.user_email
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete_appointment(self, id: str) -> None:
        model = self.db.query(AppointmentModel).filter(AppointmentModel.id == id).first()
        if not model:
            raise ValueError(f"Appointment {id} not found")
        self.db.delete(model)
        self.db.commit()
