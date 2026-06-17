from typing import List, Protocol

from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates


class IPqrsUpdatesRepository(Protocol):
    def create_update(self, update: PqrsUpdates) -> PqrsUpdates:
        ...

    def get_update_by_id(self, update_id: str) -> PqrsUpdates | None:
        ...

    def list_updates_by_pqrs_id(self, pqrs_id: str) -> List[PqrsUpdates]:
        ...

    def update_update(self, update: PqrsUpdates) -> PqrsUpdates:
        ...

    def delete_update(self, update_id: str) -> None:
        ...
