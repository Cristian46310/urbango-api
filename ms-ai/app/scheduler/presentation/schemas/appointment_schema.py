from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.scheduler.domain.entities.appoitment import AppointmentType, AppointmentReason


class CreateAppointmentRequest(BaseModel):
    type: AppointmentType
    reason: AppointmentReason
    date_time: datetime
    description: str = Field(default="", max_length=300)
    user_id: str
    user_email: str


class UpdateAppointmentRequest(BaseModel):
    type: Optional[AppointmentType] = None
    reason: Optional[AppointmentReason] = None
    date_time: Optional[datetime] = None
    description: Optional[str] = Field(default=None, max_length=300)


class AppointmentResponse(BaseModel):
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

    model_config = {"use_enum_values": True}


class SlotResponse(BaseModel):
    start: datetime
    end: datetime


class AvailabilityResponse(BaseModel):
    slots: List[SlotResponse]
