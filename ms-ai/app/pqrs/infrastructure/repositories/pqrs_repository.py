from datetime import datetime
from typing import Any, List

import psycopg2.extensions

from app.pqrs.domain.entities.pqrs import Pqrs, PqrsCategory, PqrsStatus, PqrsType
from app.pqrs.domain.ports.ipqrs_repository import IPqrsRepository


def _row_to_entity(row: dict[str, Any]) -> Pqrs:
    return Pqrs(
        id=str(row["id"]),
        ticket_number=row["ticket_number"],
        type=PqrsType(row["type"]),
        category=PqrsCategory(row["category"]),
        status=PqrsStatus(row["status"]),
        description=row["description"],
        user_id=row["user_id"] or "",
        user_email=row["user_email"],
        estimated_response_at=row.get("estimated_response_at"),
        resolved_at=row.get("resolved_at"),
        sla_alert_sent=bool(row.get("sla_alert_sent", False)),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


class PqrsRepository(IPqrsRepository):
    def __init__(self, conn: psycopg2.extensions.connection) -> None:
        self.conn = conn

    def next_ticket_number(self) -> str:
        year = datetime.now().year
        with self.conn.cursor() as cur:
            cur.execute("SELECT next_ticket_number(%s) AS ticket_number", (year,))
            row = cur.fetchone()
        return row["ticket_number"]

    def create_pqrs(self, pqrs: Pqrs) -> Pqrs:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pqrs (
                    id, ticket_number, type, category, status, description,
                    user_id, user_email, estimated_response_at, resolved_at,
                    sla_alert_sent, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    pqrs.id,
                    pqrs.ticket_number,
                    pqrs.type.value,
                    pqrs.category.value,
                    pqrs.status.value,
                    pqrs.description,
                    pqrs.user_id,
                    pqrs.user_email,
                    pqrs.estimated_response_at,
                    pqrs.resolved_at,
                    pqrs.sla_alert_sent,
                    pqrs.created_at,
                    pqrs.updated_at,
                ),
            )
            row = cur.fetchone()
        return _row_to_entity(row)

    def get_pqrs_by_id(self, pqrs_id: str) -> Pqrs | None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM pqrs WHERE id = %s", (pqrs_id,))
            row = cur.fetchone()
        return _row_to_entity(row) if row else None

    def get_pqrs_by_ticket_number(self, ticket_number: str) -> Pqrs | None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM pqrs WHERE ticket_number = %s", (ticket_number,))
            row = cur.fetchone()
        return _row_to_entity(row) if row else None

    def list_pqrs(
        self,
        status: PqrsStatus | None = None,
        category: PqrsCategory | None = None,
        user_email: str | None = None,
    ) -> List[Pqrs]:
        conditions: list[str] = []
        params: list[Any] = []

        if status is not None:
            conditions.append("status = %s")
            params.append(status.value)
        if category is not None:
            conditions.append("category = %s")
            params.append(category.value)
        if user_email is not None:
            conditions.append("user_email = %s")
            params.append(user_email)

        query = "SELECT * FROM pqrs"
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY created_at DESC"

        with self.conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def update_pqrs(self, pqrs: Pqrs) -> Pqrs:
        pqrs.updated_at = datetime.now()
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE pqrs SET
                    type = %s, category = %s, status = %s, description = %s,
                    user_id = %s, user_email = %s, estimated_response_at = %s,
                    resolved_at = %s, sla_alert_sent = %s, updated_at = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    pqrs.type.value,
                    pqrs.category.value,
                    pqrs.status.value,
                    pqrs.description,
                    pqrs.user_id,
                    pqrs.user_email,
                    pqrs.estimated_response_at,
                    pqrs.resolved_at,
                    pqrs.sla_alert_sent,
                    pqrs.updated_at,
                    pqrs.id,
                ),
            )
            row = cur.fetchone()
        if not row:
            raise ValueError(f"PQRS {pqrs.id} not found")
        return _row_to_entity(row)

    def delete_pqrs(self, pqrs_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM pqrs WHERE id = %s", (pqrs_id,))

    def list_overdue_pqrs(self) -> List[Pqrs]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM pqrs
                WHERE status != 'resolved'
                  AND estimated_response_at IS NOT NULL
                  AND estimated_response_at < NOW()
                  AND sla_alert_sent = FALSE
                ORDER BY estimated_response_at ASC
                """
            )
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def mark_sla_alert_sent(self, pqrs_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE pqrs SET sla_alert_sent = TRUE, updated_at = NOW() WHERE id = %s",
                (pqrs_id,),
            )
