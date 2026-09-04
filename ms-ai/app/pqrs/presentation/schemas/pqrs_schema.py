from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.pqrs.domain.entities.pqrs import PqrsCategory, PqrsStatus, PqrsType

ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


class CreatePqrsImageRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    content_base64: str = Field(..., min_length=1)

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, value: str) -> str:
        normalized = value.lower().strip()
        if normalized not in ALLOWED_IMAGE_MIME_TYPES:
            allowed = ", ".join(sorted(ALLOWED_IMAGE_MIME_TYPES))
            raise ValueError(f"Unsupported mime_type '{value}'. Allowed: {allowed}")
        return normalized


class CreatePqrsRequest(BaseModel):
    type: PqrsType
    category: PqrsCategory | None = Field(
        default=None,
        description="Si se omite, LangGraph clasifica contra el enum (whitelist).",
    )
    description: str = Field(default="", max_length=500)
    user_id: str
    user_email: str
    images: list[CreatePqrsImageRequest] = Field(default_factory=list, max_length=3)


class PqrsImageResponse(BaseModel):
    id: str
    pqrs_id: str
    image_url: str
    original_name: str
    mime_type: str
    size: int


class PqrsUpdateResponse(BaseModel):
    id: str
    pqrs_id: str
    status_from: PqrsStatus | None = None
    status_to: PqrsStatus | None = None
    action: str
    description: str
    agent_response: str
    created_at: datetime

    model_config = {"use_enum_values": True}


class PqrsResponse(BaseModel):
    id: str
    ticket_number: str
    type: PqrsType
    category: PqrsCategory
    status: PqrsStatus
    description: str
    user_id: str
    user_email: str
    estimated_response_at: datetime | None = None
    resolved_at: datetime | None = None
    sla_alert_sent: bool
    created_at: datetime
    updated_at: datetime
    images: list[PqrsImageResponse] = Field(default_factory=list)
    updates: list[PqrsUpdateResponse] = Field(default_factory=list)

    model_config = {"use_enum_values": True}


class UpdatePqrsRequest(BaseModel):
    type: Optional[PqrsType] = None
    category: Optional[PqrsCategory] = None
    description: Optional[str] = Field(default=None, max_length=500)
    user_email: Optional[str] = None


class CreatePqrsUpdateRequest(BaseModel):
    status_to: PqrsStatus
    description: str = Field(default="", max_length=1000)
    agent_response: str = Field(default="", max_length=2000)
    action: str = Field(default="status_change", max_length=100)
