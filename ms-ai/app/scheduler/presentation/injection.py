from functools import lru_cache

import psycopg2.extensions
from fastapi import Depends

from app.scheduler.infrastructure.database import get_db
from app.scheduler.infrastructure.repositories.appointment_repository import AppointmentRepository
from app.scheduler.infrastructure.provider.google_calendar import GoogleCalendarProvider
from app.scheduler.infrastructure.clients.notification_client import HttpNotificationClient

from app.scheduler.application.use_cases.create_appointment import CreateAppointmentUseCase
from app.scheduler.application.use_cases.get_appointment_by_id import GetAppointmentByIdUseCase
from app.scheduler.application.use_cases.get_all_appointments import GetAllAppointmentsUseCase
from app.scheduler.application.use_cases.get_appointments_by_user_id import GetAppointmentsByUserIdUseCase
from app.scheduler.application.use_cases.update_appointment import UpdateAppointmentUseCase
from app.scheduler.application.use_cases.delete_appointment import DeleteAppointmentUseCase
from app.scheduler.application.use_cases.get_available_slots import GetAvailableSlotsUseCase


@lru_cache
def _get_calendar_provider() -> GoogleCalendarProvider:
    return GoogleCalendarProvider()


@lru_cache
def _get_notification_client() -> HttpNotificationClient:
    return HttpNotificationClient()


def get_create_appointment(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> CreateAppointmentUseCase:
    return CreateAppointmentUseCase(
        appointment_repo=AppointmentRepository(conn),
        calendar_repo=_get_calendar_provider(),
        notification_port=_get_notification_client(),
    )


def get_appointment_by_id(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetAppointmentByIdUseCase:
    return GetAppointmentByIdUseCase(AppointmentRepository(conn))


def get_all_appointments(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetAllAppointmentsUseCase:
    return GetAllAppointmentsUseCase(AppointmentRepository(conn))


def get_appointments_by_user_id(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetAppointmentsByUserIdUseCase:
    return GetAppointmentsByUserIdUseCase(AppointmentRepository(conn))


def get_update_appointment(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> UpdateAppointmentUseCase:
    return UpdateAppointmentUseCase(
        appointment_repo=AppointmentRepository(conn),
        calendar_repo=_get_calendar_provider(),
        notification_port=_get_notification_client(),
    )


def get_delete_appointment(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> DeleteAppointmentUseCase:
    return DeleteAppointmentUseCase(
        appointment_repo=AppointmentRepository(conn),
        calendar_repo=_get_calendar_provider(),
        notification_port=_get_notification_client(),
    )


def get_available_slots() -> GetAvailableSlotsUseCase:
    return GetAvailableSlotsUseCase(_get_calendar_provider())
