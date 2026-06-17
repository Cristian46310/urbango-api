from dataclasses import dataclass
from datetime import datetime

from app.pqrs.domain.entities.pqrs import PqrsCategory, PqrsStatus, PqrsType
from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates


@dataclass
class PqrsDTO:
    id: str
    ticket_number: str
    type: PqrsType
    category: PqrsCategory
    status: PqrsStatus
    description: str
    user_id: str
    user_email: str
    estimated_response_at: datetime | None
    resolved_at: datetime | None
    sla_alert_sent: bool
    created_at: datetime
    updated_at: datetime
    images: list[PqrsImages]
    updates: list[PqrsUpdates]


@dataclass
class PqrsUpdateDTO:
    id: str
    pqrs_id: str
    status_from: PqrsStatus | None
    status_to: PqrsStatus | None
    action: str
    description: str
    agent_response: str
    created_at: datetime
