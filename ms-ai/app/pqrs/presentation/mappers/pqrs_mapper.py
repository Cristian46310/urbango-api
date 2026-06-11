from app.pqrs.application.dto.pqrs_dto import PqrsDTO, PqrsUpdateDTO
from app.pqrs.presentation.schemas.pqrs_schema import (
    PqrsImageResponse,
    PqrsResponse,
    PqrsUpdateResponse,
)


def dto_to_response(dto: PqrsDTO) -> PqrsResponse:
    return PqrsResponse(
        id=dto.id,
        ticket_number=dto.ticket_number,
        type=dto.type,
        category=dto.category,
        status=dto.status,
        description=dto.description,
        user_id=dto.user_id,
        user_email=dto.user_email,
        estimated_response_at=dto.estimated_response_at,
        resolved_at=dto.resolved_at,
        sla_alert_sent=dto.sla_alert_sent,
        created_at=dto.created_at,
        updated_at=dto.updated_at,
        images=[
            PqrsImageResponse(
                id=img.id,
                pqrs_id=img.pqrs_id,
                image_url=img.image_url,
                original_name=img.original_name,
                mime_type=img.mime_type,
                size=img.size,
            )
            for img in dto.images
        ],
        updates=[update_dto_to_response(update) for update in dto.updates],
    )


def update_dto_to_response(dto: PqrsUpdateDTO) -> PqrsUpdateResponse:
    return PqrsUpdateResponse(
        id=dto.id,
        pqrs_id=dto.pqrs_id,
        status_from=dto.status_from,
        status_to=dto.status_to,
        action=dto.action,
        description=dto.description,
        agent_response=dto.agent_response,
        created_at=dto.created_at,
    )
