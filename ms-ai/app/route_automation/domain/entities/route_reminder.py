from enum import Enum
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field


class ReminderSyncStatus(str, Enum):
    PENDING = "PENDING"
    SYNCED = "SYNCED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class RouteReminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_schedule_id: str
    user_id: str = ""
    user_email: str = ""
    calendar_event_id: Optional[str] = None
    sync_status: ReminderSyncStatus = ReminderSyncStatus.PENDING
    last_error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
