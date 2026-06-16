from app.pqrs.application.dto.pqrs_dto import PqrsDTO
from app.pqrs.application.mappers.pqrs_mapper import pqrs_to_dto
from app.pqrs.domain.ports.ipqrs_images_repository import IPqrsImagesRepository
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository


class GetPqrsByTicketNumberUseCase:
    def __init__(
        self,
        pqrs_repo: IPqrsRepository,
        images_repo: IPqrsImagesRepository,
        updates_repo: IPqrsUpdatesRepository,
    ) -> None:
        self.pqrs_repo = pqrs_repo
        self.images_repo = images_repo
        self.updates_repo = updates_repo

    def execute(self, ticket_number: str) -> PqrsDTO:
        pqrs = self.pqrs_repo.get_pqrs_by_ticket_number(ticket_number)
        if not pqrs:
            raise ValueError(f"PQRS {ticket_number} not found")
        images = self.images_repo.list_by_pqrs_id(pqrs.id)
        updates = self.updates_repo.list_updates_by_pqrs_id(pqrs.id)
        return pqrs_to_dto(pqrs, images=images, updates=updates)
