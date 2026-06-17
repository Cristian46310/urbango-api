from typing import List, Protocol

from app.pqrs.domain.entities.pqrs import Pqrs, PqrsCategory, PqrsStatus, PqrsType


class IPqrsRepository(Protocol):
    def next_ticket_number(self) -> str:
        ...

    def create_pqrs(self, pqrs: Pqrs) -> Pqrs:
        ...

    def get_pqrs_by_id(self, pqrs_id: str) -> Pqrs | None:
        ...

    def get_pqrs_by_ticket_number(self, ticket_number: str) -> Pqrs | None:
        ...

    def list_pqrs(
        self,
        status: PqrsStatus | None = None,
        category: PqrsCategory | None = None,
        user_email: str | None = None,
    ) -> List[Pqrs]:
        ...

    def update_pqrs(self, pqrs: Pqrs) -> Pqrs:
        ...

    def delete_pqrs(self, pqrs_id: str) -> None:
        ...

    def list_overdue_pqrs(self) -> List[Pqrs]:
        ...

    def mark_sla_alert_sent(self, pqrs_id: str) -> None:
        ...
