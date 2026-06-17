from app.pqrs.application.dto.pqrs_dto import PqrsUpdateDTO
from app.pqrs.application.mappers.pqrs_mapper import update_to_dto
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository


class ListPqrsUpdatesUseCase:
    def __init__(self, updates_repo: IPqrsUpdatesRepository) -> None:
        self.updates_repo = updates_repo

    def execute(self, pqrs_id: str) -> list[PqrsUpdateDTO]:
        updates = self.updates_repo.list_updates_by_pqrs_id(pqrs_id)
        return [update_to_dto(update) for update in updates]
