from datetime import datetime
from enum import Enum
from typing import Optional
import uuid
from pydantic import BaseModel, Field


class AppointmentType(Enum):
    VIRTUAL = "virtual"
    IN_PERSON = "in_person"


class AppointmentReason(Enum):
    CREDIT_CARD = "credit_card"
    COMPLAINT = "complaint"
    REFUND = "refund"
    OTHER = "other"


class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: AppointmentType = Field(default=AppointmentType.VIRTUAL)
    reason: AppointmentReason = Field(default=AppointmentReason.OTHER)
    date_time: datetime = Field(default_factory=datetime.now)
    description: str = Field(default="", max_length=300)
    created_at: datetime = Field(default_factory=datetime.now)
    location: str = Field(default="")
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str = Field(default="user@example.com")
    calendar_event_id: Optional[str] = Field(default=None)
