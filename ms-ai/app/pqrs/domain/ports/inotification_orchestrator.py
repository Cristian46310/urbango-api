from typing import List, Protocol

from app.pqrs.domain.entities.pqrs import Pqrs
from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates


class INotificationOrchestrator(Protocol):
    def notify_pqrs_created(self, pqrs: Pqrs, images: List[PqrsImages]) -> None:
        ...

    def notify_status_change(self, pqrs: Pqrs, update: PqrsUpdates) -> None:
        ...

    def notify_sla_breach(self, pqrs: Pqrs) -> None:
        ...
