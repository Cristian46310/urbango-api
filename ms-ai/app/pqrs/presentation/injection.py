from functools import lru_cache

import psycopg2.extensions
from fastapi import Depends

from app.pqrs.application.use_cases.create_pqrs import CreatePqrsUseCase
from app.pqrs.application.use_cases.create_pqrs_update import CreatePqrsUpdateUseCase
from app.pqrs.application.use_cases.delete_pqrs import DeletePqrsUseCase
from app.pqrs.application.use_cases.get_pqrs_by_id import GetPqrsByIdUseCase
from app.pqrs.application.use_cases.get_pqrs_by_ticket_number import GetPqrsByTicketNumberUseCase
from app.pqrs.application.use_cases.get_pqrs_update_by_id import GetPqrsUpdateByIdUseCase
from app.pqrs.application.use_cases.list_pqrs import ListPqrsUseCase
from app.pqrs.application.use_cases.list_pqrs_updates import ListPqrsUpdatesUseCase
from app.pqrs.application.use_cases.update_pqrs import UpdatePqrsUseCase
from app.pqrs.infrastructure.agents.notification_graph import LangGraphNotificationOrchestrator
from app.pqrs.infrastructure.repositories.pqrs_images_repository import PqrsImagesRepository
from app.pqrs.infrastructure.repositories.pqrs_repository import PqrsRepository
from app.pqrs.infrastructure.repositories.pqrs_updates_repository import PqrsUpdatesRepository
from app.pqrs.infrastructure.storage.supabase_storage import SupabaseStorageAdapter
from app.scheduler.infrastructure.database import get_db


@lru_cache
def _get_notification_orchestrator() -> LangGraphNotificationOrchestrator:
    return LangGraphNotificationOrchestrator()


@lru_cache
def _get_storage_adapter() -> SupabaseStorageAdapter:
    return SupabaseStorageAdapter()


def get_create_pqrs(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> CreatePqrsUseCase:
    return CreatePqrsUseCase(
        pqrs_repo=PqrsRepository(conn),
        images_repo=PqrsImagesRepository(conn),
        updates_repo=PqrsUpdatesRepository(conn),
        storage_port=_get_storage_adapter(),
        notification_orchestrator=_get_notification_orchestrator(),
    )


def get_pqrs_by_id(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetPqrsByIdUseCase:
    return GetPqrsByIdUseCase(
        pqrs_repo=PqrsRepository(conn),
        images_repo=PqrsImagesRepository(conn),
        updates_repo=PqrsUpdatesRepository(conn),
    )


def get_pqrs_by_ticket_number(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetPqrsByTicketNumberUseCase:
    return GetPqrsByTicketNumberUseCase(
        pqrs_repo=PqrsRepository(conn),
        images_repo=PqrsImagesRepository(conn),
        updates_repo=PqrsUpdatesRepository(conn),
    )


def get_list_pqrs(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> ListPqrsUseCase:
    return ListPqrsUseCase(
        pqrs_repo=PqrsRepository(conn),
        images_repo=PqrsImagesRepository(conn),
    )


def get_update_pqrs(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> UpdatePqrsUseCase:
    return UpdatePqrsUseCase(
        pqrs_repo=PqrsRepository(conn),
        images_repo=PqrsImagesRepository(conn),
    )


def get_delete_pqrs(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> DeletePqrsUseCase:
    return DeletePqrsUseCase(
        pqrs_repo=PqrsRepository(conn),
        images_repo=PqrsImagesRepository(conn),
        updates_repo=PqrsUpdatesRepository(conn),
    )


def get_create_pqrs_update(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> CreatePqrsUpdateUseCase:
    return CreatePqrsUpdateUseCase(
        pqrs_repo=PqrsRepository(conn),
        updates_repo=PqrsUpdatesRepository(conn),
        notification_orchestrator=_get_notification_orchestrator(),
    )


def get_list_pqrs_updates(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> ListPqrsUpdatesUseCase:
    return ListPqrsUpdatesUseCase(PqrsUpdatesRepository(conn))


def get_pqrs_update_by_id(
    conn: psycopg2.extensions.connection = Depends(get_db),
) -> GetPqrsUpdateByIdUseCase:
    return GetPqrsUpdateByIdUseCase(PqrsUpdatesRepository(conn))
