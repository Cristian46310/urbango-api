from typing import Any, List

import psycopg2.extensions

from app.pqrs.domain.entities.pqrs import PqrsStatus
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates
from app.pqrs.domain.ports.ipqrs_updates_repository import IPqrsUpdatesRepository


def _row_to_entity(row: dict[str, Any]) -> PqrsUpdates:
    status_from = PqrsStatus(row["status_from"]) if row.get("status_from") else None
    status_to = PqrsStatus(row["status_to"]) if row.get("status_to") else None
    return PqrsUpdates(
        id=str(row["id"]),
        pqrs_id=str(row["pqrs_id"]),
        status_from=status_from,
        status_to=status_to,
        action=row["action"],
        description=row["description"],
        agent_response=row.get("agent_response") or "",
        created_at=row["created_at"],
    )


class PqrsUpdatesRepository(IPqrsUpdatesRepository):
    def __init__(self, conn: psycopg2.extensions.connection) -> None:
        self.conn = conn

    def create_update(self, update: PqrsUpdates) -> PqrsUpdates:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pqrs_updates (
                    id, pqrs_id, status_from, status_to, action, description, agent_response, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    update.id,
                    update.pqrs_id,
                    update.status_from.value if update.status_from else None,
                    update.status_to.value if update.status_to else None,
                    update.action,
                    update.description,
                    update.agent_response,
                    update.created_at,
                ),
            )
            row = cur.fetchone()
        return _row_to_entity(row)

    def get_update_by_id(self, update_id: str) -> PqrsUpdates | None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM pqrs_updates WHERE id = %s", (update_id,))
            row = cur.fetchone()
        return _row_to_entity(row) if row else None

    def list_updates_by_pqrs_id(self, pqrs_id: str) -> List[PqrsUpdates]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM pqrs_updates WHERE pqrs_id = %s ORDER BY created_at ASC",
                (pqrs_id,),
            )
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def update_update(self, update: PqrsUpdates) -> PqrsUpdates:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE pqrs_updates SET
                    status_from = %s, status_to = %s, action = %s,
                    description = %s, agent_response = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    update.status_from.value if update.status_from else None,
                    update.status_to.value if update.status_to else None,
                    update.action,
                    update.description,
                    update.agent_response,
                    update.id,
                ),
            )
            row = cur.fetchone()
        if not row:
            raise ValueError(f"PQRS update {update.id} not found")
        return _row_to_entity(row)

    def delete_update(self, update_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM pqrs_updates WHERE id = %s", (update_id,))
