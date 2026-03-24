from pydantic import BaseModel
from typing import Optional, List


class EmailDTO(BaseModel):
    to: str
    subject: str
    body: str
    files: Optional[List[str]] = None  # Rutas de los archivos a adjuntar
