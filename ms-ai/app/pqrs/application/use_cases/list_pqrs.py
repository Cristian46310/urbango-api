from app.pqrs.application.dto.pqrs_dto import PqrsDTO
from app.pqrs.application.mappers.pqrs_mapper import pqrs_to_dto
from app.pqrs.domain.entities.pqrs import PqrsCategory, PqrsStatus
from app.pqrs.domain.ports.ipqrs_images_repository import IPqrsImagesRepository
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository


class ListPqrsUseCase:
    def __init__(
        self,
        pqrs_repo: IPqrsRepository,
        images_repo: IPqrsImagesRepository,
    ) -> None:
        self.pqrs_repo = pqrs_repo
        self.images_repo = images_repo

    def execute(
        self,
        status: PqrsStatus | None = None,
        category: PqrsCategory | None = None,
        user_email: str | None = None,
    ) -> list[PqrsDTO]:
        pqrs_list = self.pqrs_repo.list_pqrs(status=status, category=category, user_email=user_email)
        return [
            pqrs_to_dto(pqrs, images=self.images_repo.list_by_pqrs_id(pqrs.id))
            for pqrs in pqrs_list
        ]
