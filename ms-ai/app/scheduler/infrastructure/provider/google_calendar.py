import os
import pickle
import uuid
from datetime import datetime
from typing import List

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from app.config.settings import settings
from app.scheduler.domain.entities.calendar import CalendarEvent
from app.scheduler.domain.ports.icalendar_repository import ICalendarRepository
from app.scheduler.infrastructure.provider.mapper import gcal_event_to_entity


class GoogleCalendarProvider(ICalendarRepository):
    def __init__(self) -> None:
        self.calendar_id = settings.GOOGLE_CALENDAR_ID
        self._service = None

    def _get_service(self):
        if self._service:
            return self._service

        creds = None
        token_path = os.path.join(settings.SECRETS_LOCATION, "token.pickle")

        if os.path.exists(token_path):
            with open(token_path, "rb") as f:
                creds = pickle.load(f)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                secrets_file = os.path.join(settings.SECRETS_LOCATION, settings.CLIENT_SECRET)
                flow = InstalledAppFlow.from_client_secrets_file(secrets_file, settings.SCOPES)
                creds = flow.run_local_server(port=8765)

            with open(token_path, "wb") as f:
                pickle.dump(creds, f)

        self._service = build("calendar", "v3", credentials=creds)
        return self._service

    def create_calendar_event(
        self,
        start_date: datetime,
        end_date: datetime,
        description: str,
        location: str,
        *,
        summary: str = "Cita",
        attendee_email: str | None = None,
        virtual: bool = False,
    ) -> CalendarEvent:
        service = self._get_service()

        body: dict = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_date.isoformat(), "timeZone": settings.TIMEZONE},
            "end": {"dateTime": end_date.isoformat(), "timeZone": settings.TIMEZONE},
        }

        if virtual:
            body["conferenceData"] = {
                "createRequest": {
                    "requestId": f"meet-{uuid.uuid4()}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }
        else:
            body["location"] = location

        if attendee_email:
            body["attendees"] = [{"email": attendee_email}]

        kwargs: dict = {"calendarId": self.calendar_id, "body": body}
        if virtual:
            kwargs["conferenceDataVersion"] = 1

        event = service.events().insert(**kwargs).execute()
        return gcal_event_to_entity(event)

    def get_calendar_events_by_date_range(
        self, start_date: datetime, end_date: datetime
    ) -> List[CalendarEvent]:
        service = self._get_service()
        time_min = start_date.isoformat() + "Z" if start_date.tzinfo is None else start_date.isoformat()
        time_max = end_date.isoformat() + "Z" if end_date.tzinfo is None else end_date.isoformat()
        events_result = (
            service.events()
            .list(
                calendarId=self.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        return [gcal_event_to_entity(e) for e in events_result.get("items", [])]

    def update_calendar_event(
        self,
        calendar_event_id: str,
        start_date: datetime,
        end_date: datetime,
        description: str,
        location: str,
        *,
        virtual: bool = False,
    ) -> CalendarEvent:
        service = self._get_service()
        body: dict = {
            "start": {"dateTime": start_date.isoformat(), "timeZone": settings.TIMEZONE},
            "end": {"dateTime": end_date.isoformat(), "timeZone": settings.TIMEZONE},
            "description": description,
        }

        if virtual:
            body["conferenceData"] = {
                "createRequest": {
                    "requestId": f"meet-{uuid.uuid4()}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }
        else:
            body["location"] = location

        kwargs: dict = {
            "calendarId": self.calendar_id,
            "eventId": calendar_event_id,
            "body": body,
        }
        if virtual:
            kwargs["conferenceDataVersion"] = 1

        event = service.events().patch(**kwargs).execute()
        return gcal_event_to_entity(event)

    def cancel_calendar_event(self, calendar_event_id: str) -> None:
        service = self._get_service()
        service.events().delete(calendarId=self.calendar_id, eventId=calendar_event_id).execute()
