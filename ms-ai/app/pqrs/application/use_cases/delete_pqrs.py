from app.pqrs.domain.ports.ipqrs_images_repository import IPqrsImagesRepository
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository


class DeletePqrsUseCase:
    def __init__(
        self,
        pqrs_repo: IPqrsRepository,
        images_repo: IPqrsImagesRepository,
        updates_repo: IPqrsUpdatesRepository,
    ) -> None:
        self.pqrs_repo = pqrs_repo
        self.images_repo = images_repo
        self.updates_repo = updates_repo

    def execute(self, pqrs_id: str) -> None:
        pqrs = self.pqrs_repo.get_pqrs_by_id(pqrs_id)
        if not pqrs:
            raise ValueError(f"PQRS {pqrs_id} not found")
        self.pqrs_repo.delete_pqrs(pqrs_id)
