from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from app.pqrs.domain.entities.pqrs import PqrsStatus


class PqrsUpdates(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pqrs_id: str = Field(default="")
    status_from: PqrsStatus | None = None
    status_to: PqrsStatus | None = None
    action: str = Field(default="")
    description: str = Field(default="")
    agent_response: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.now)
