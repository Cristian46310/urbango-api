import uuid

from pydantic import BaseModel, Field


class PqrsImages(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pqrs_id: str = Field(default="")
    image_url: str = Field(default="")
    original_name: str = Field(default="")
    mime_type: str = Field(default="")
    size: int = Field(default=0)
