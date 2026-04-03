from pydantic import BaseModel
from typing import Optional


class EmailResponseDTO(BaseModel):
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    message: str
