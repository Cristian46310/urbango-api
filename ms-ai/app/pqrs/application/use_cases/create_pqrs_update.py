from datetime import datetime

from app.pqrs.application.dto.pqrs_dto import PqrsUpdateDTO
from app.pqrs.application.helpers.pqrs_helpers import validate_status_transition
from app.pqrs.application.mappers.pqrs_mapper import update_to_dto
from app.pqrs.domain.entities.pqrs import PqrsStatus
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates
from app.pqrs.domain.ports.inotification_orchestrator import INotificationOrchestrator
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository


class CreatePqrsUpdateUseCase:
    def __init__(
        self,
        pqrs_repo: IPqrsRepository,
        updates_repo: IPqrsUpdatesRepository,
        notification_orchestrator: INotificationOrchestrator,
    ) -> None:
        self.pqrs_repo = pqrs_repo
        self.updates_repo = updates_repo
        self.notification_orchestrator = notification_orchestrator

    def execute(
        self,
        pqrs_id: str,
        status_to: PqrsStatus,
        description: str = "",
        agent_response: str = "",
        action: str = "status_change",
    ) -> PqrsUpdateDTO:
        pqrs = self.pqrs_repo.get_pqrs_by_id(pqrs_id)
        if not pqrs:
            raise ValueError(f"PQRS {pqrs_id} not found")

        validate_status_transition(pqrs.status, status_to)

        if status_to == PqrsStatus.RESOLVED and not agent_response.strip():
            raise ValueError("agent_response is required when resolving a PQRS")

        status_from = pqrs.status
        update = PqrsUpdates(
            pqrs_id=pqrs_id,
            status_from=status_from,
            status_to=status_to,
            action=action,
            description=description,
            agent_response=agent_response,
        )
        saved_update = self.updates_repo.create_update(update)

        pqrs.status = status_to
        if status_to == PqrsStatus.RESOLVED:
            pqrs.resolved_at = datetime.now()
        updated_pqrs = self.pqrs_repo.update_pqrs(pqrs)

        try:
            self.notification_orchestrator.notify_status_change(updated_pqrs, saved_update)
        except Exception:
            pass

        return update_to_dto(saved_update)
