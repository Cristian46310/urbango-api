from pydantic import BaseModel, Field


class CreateRouteReminderRequest(BaseModel):
    business_schedule_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    user_email: str = Field(..., min_length=3)


class RouteReminderResponse(BaseModel):
    reminder_id: str
    calendar_event_id: str | None = None
    sync_status: str
    departure_time: str | None = None
    route_name: str = ""
    last_error: str | None = None
