from app.pqrs.application.dto.pqrs_dto import PqrsDTO
from app.pqrs.application.helpers.pqrs_helpers import validate_email
from app.pqrs.application.mappers.pqrs_mapper import pqrs_to_dto
from app.pqrs.domain.entities.pqrs import PqrsCategory, PqrsType
from app.pqrs.domain.ports.ipqrs_images_repository import IPqrsImagesRepository
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository


class UpdatePqrsUseCase:
    MAX_DESCRIPTION_LENGTH = 500

    def __init__(
        self,
        pqrs_repo: IPqrsRepository,
        images_repo: IPqrsImagesRepository,
    ) -> None:
        self.pqrs_repo = pqrs_repo
        self.images_repo = images_repo

    def execute(
        self,
        pqrs_id: str,
        type: PqrsType | None = None,
        category: PqrsCategory | None = None,
        description: str | None = None,
        user_email: str | None = None,
    ) -> PqrsDTO:
        pqrs = self.pqrs_repo.get_pqrs_by_id(pqrs_id)
        if not pqrs:
            raise ValueError(f"PQRS {pqrs_id} not found")

        if type is not None:
            pqrs.type = type
        if category is not None:
            pqrs.category = category
        if description is not None:
            if len(description) > self.MAX_DESCRIPTION_LENGTH:
                raise ValueError(f"Description must be at most {self.MAX_DESCRIPTION_LENGTH} characters")
            pqrs.description = description
        if user_email is not None:
            validate_email(user_email)
            pqrs.user_email = user_email

        updated = self.pqrs_repo.update_pqrs(pqrs)
        images = self.images_repo.list_by_pqrs_id(pqrs_id)
        return pqrs_to_dto(updated, images=images)
