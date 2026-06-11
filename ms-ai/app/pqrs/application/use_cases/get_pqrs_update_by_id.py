from app.pqrs.application.dto.pqrs_dto import PqrsUpdateDTO
from app.pqrs.application.mappers.pqrs_mapper import update_to_dto
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository


class GetPqrsUpdateByIdUseCase:
    def __init__(self, updates_repo: IPqrsUpdatesRepository) -> None:
        self.updates_repo = updates_repo

    def execute(self, update_id: str) -> PqrsUpdateDTO:
        update = self.updates_repo.get_update_by_id(update_id)
        if not update:
            raise ValueError(f"PQRS update {update_id} not found")
        return update_to_dto(update)
