from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.scheduler.domain.entities.appoitment import AppointmentType, AppointmentReason


class AppointmentDTO(BaseModel):
    id: str
    calendar_event_id: Optional[str]
    type: AppointmentType
    reason: AppointmentReason
    date_time: datetime
    description: str
    location: str
    user_id: str
    user_email: str
    created_at: datetime


class SlotDTO(BaseModel):
    start: datetime
    end: datetime
