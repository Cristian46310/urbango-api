from datetime import datetime

from app.pqrs.application.use_cases.classify_pqrs_category import ClassifyPqrsCategoryUseCase
from app.pqrs.application.dto.pqrs_dto import PqrsDTO
from app.pqrs.application.helpers.pqrs_helpers import (
    calculate_estimated_response_at,
    validate_email,
)
from app.pqrs.application.mappers.pqrs_mapper import pqrs_to_dto
from app.pqrs.domain.entities.pqrs import Pqrs, PqrsCategory, PqrsStatus, PqrsType
from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates
from app.pqrs.domain.ports.inotification_orchestrator import INotificationOrchestrator
from app.pqrs.domain.ports.ipqrs_images_repository import IPqrsImagesRepository
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository
from app.pqrs.domain.ports.istorage_port import IStoragePort, UploadFile


class CreatePqrsUseCase:
    MAX_IMAGES = 3
    MAX_IMAGE_SIZE = 5 * 1024 * 1024
    MAX_DESCRIPTION_LENGTH = 500

    def __init__(
        self,
        pqrs_repo: IPqrsRepository,
        images_repo: IPqrsImagesRepository,
        updates_repo: IPqrsUpdatesRepository,
        storage_port: IStoragePort,
        notification_orchestrator: INotificationOrchestrator,
        category_classifier: ClassifyPqrsCategoryUseCase | None = None,
    ) -> None:
        self.pqrs_repo = pqrs_repo
        self.images_repo = images_repo
        self.updates_repo = updates_repo
        self.storage_port = storage_port
        self.notification_orchestrator = notification_orchestrator
        self.category_classifier = category_classifier

    def execute(
        self,
        type: PqrsType,
        description: str,
        user_email: str,
        category: PqrsCategory | None = None,
        user_id: str = "",
        files: list[UploadFile] | None = None,
    ) -> PqrsDTO:
        if len(description) > self.MAX_DESCRIPTION_LENGTH:
            raise ValueError(f"Description must be at most {self.MAX_DESCRIPTION_LENGTH} characters")
        validate_email(user_email)

        resolved_category = category
        if resolved_category is None:
            if not self.category_classifier:
                raise ValueError("category is required when classifier is not configured")
            resolved_category = self.category_classifier.execute(
                description, pqrs_type=type.value
            )

        upload_files = files or []
        if len(upload_files) > self.MAX_IMAGES:
            raise ValueError(f"At most {self.MAX_IMAGES} images are allowed")
        for file in upload_files:
            if file.size > self.MAX_IMAGE_SIZE:
                raise ValueError(f"Image {file.original_name} exceeds 5MB limit")

        ticket_number = self.pqrs_repo.next_ticket_number()
        estimated_response_at = calculate_estimated_response_at(resolved_category)

        pqrs = Pqrs(
            ticket_number=ticket_number,
            type=type,
            category=resolved_category,
            status=PqrsStatus.RECEIVED,
            description=description,
            user_id=user_id,
            user_email=user_email,
            estimated_response_at=estimated_response_at,
        )
        saved_pqrs = self.pqrs_repo.create_pqrs(pqrs)

        stored_images: list[PqrsImages] = []
        if upload_files:
            stored = self.storage_port.upload_many(upload_files, ticket_number)
            image_entities = [
                PqrsImages(
                    pqrs_id=saved_pqrs.id,
                    image_url=item.public_url,
                    original_name=item.original_name,
                    mime_type=item.mime_type,
                    size=item.size,
                )
                for item in stored
            ]
            stored_images = self.images_repo.create_many(image_entities)

        initial_update = PqrsUpdates(
            pqrs_id=saved_pqrs.id,
            status_from=None,
            status_to=PqrsStatus.RECEIVED,
            action="created",
            description="PQRS recibido",
        )
        self.updates_repo.create_update(initial_update)

        try:
            self.notification_orchestrator.notify_pqrs_created(saved_pqrs, stored_images)
        except Exception:
            pass

        return pqrs_to_dto(saved_pqrs, images=stored_images)
