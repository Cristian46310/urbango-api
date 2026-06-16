from datetime import datetime
from pydantic import BaseModel, Field
import uuid

# Evento del calendario (o representacion de un evento en el calendario simplificada)
class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="The id of the calendar event")
    start_date: datetime = Field(default_factory=lambda: datetime.now(), description="The start date of the calendar event")
    end_date: datetime = Field(default_factory=lambda: datetime.now(), description="The end date of the calendar event")
    description: str = Field(default="", description="The description of the calendar event")
    location: str = Field(default="", description="The location of the calendar event")