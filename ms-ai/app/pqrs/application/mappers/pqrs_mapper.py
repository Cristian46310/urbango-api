from app.pqrs.application.dto.pqrs_dto import PqrsDTO, PqrsUpdateDTO
from app.pqrs.domain.entities.pqrs import Pqrs
from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates


def pqrs_to_dto(
    pqrs: Pqrs,
    images: list[PqrsImages] | None = None,
    updates: list[PqrsUpdates] | None = None,
) -> PqrsDTO:
    return PqrsDTO(
        id=pqrs.id,
        ticket_number=pqrs.ticket_number,
        type=pqrs.type,
        category=pqrs.category,
        status=pqrs.status,
        description=pqrs.description,
        user_id=pqrs.user_id,
        user_email=pqrs.user_email,
        estimated_response_at=pqrs.estimated_response_at,
        resolved_at=pqrs.resolved_at,
        sla_alert_sent=pqrs.sla_alert_sent,
        created_at=pqrs.created_at,
        updated_at=pqrs.updated_at,
        images=images or [],
        updates=updates or [],
    )


def update_to_dto(update: PqrsUpdates) -> PqrsUpdateDTO:
    return PqrsUpdateDTO(
        id=update.id,
        pqrs_id=update.pqrs_id,
        status_from=update.status_from,
        status_to=update.status_to,
        action=update.action,
        description=update.description,
        agent_response=update.agent_response,
        created_at=update.created_at,
    )
