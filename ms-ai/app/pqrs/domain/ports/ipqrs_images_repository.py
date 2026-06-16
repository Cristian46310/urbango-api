from typing import List, Protocol

from app.pqrs.domain.entities.pqrs_images import PqrsImages


class IPqrsImagesRepository(Protocol):
    def create_image(self, image: PqrsImages) -> PqrsImages:
        ...

    def create_many(self, images: List[PqrsImages]) -> List[PqrsImages]:
        ...

    def list_by_pqrs_id(self, pqrs_id: str) -> List[PqrsImages]:
        ...

    def delete_by_pqrs_id(self, pqrs_id: str) -> None:
        ...
