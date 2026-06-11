from datetime import datetime
from enum import Enum
import uuid

from pydantic import BaseModel, Field


class PqrsType(str, Enum):
    PETITION = "petition"
    COMPLAINT = "complaint"
    CLAIM = "claim"
    SUGGESTION = "suggestion"


class PqrsCategory(str, Enum):
    DRIVER = "driver"
    BUS = "bus"
    ROUTE = "route"
    CARD = "card"
    OTHER = "other"


class PqrsStatus(str, Enum):
    RECEIVED = "received"
    IN_REVIEW = "in_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class Pqrs(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_number: str = Field(default="")
    type: PqrsType = Field(default=PqrsType.PETITION)
    category: PqrsCategory = Field(default=PqrsCategory.OTHER)
    status: PqrsStatus = Field(default=PqrsStatus.RECEIVED)
    description: str = Field(default="", max_length=500)
    user_id: str = Field(default="")
    user_email: str = Field(default="")
    estimated_response_at: datetime | None = None
    resolved_at: datetime | None = None
    sla_alert_sent: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
