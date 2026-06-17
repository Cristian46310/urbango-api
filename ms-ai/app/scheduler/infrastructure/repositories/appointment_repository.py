from datetime import datetime
from typing import Any, List

import psycopg2.extensions

from app.scheduler.domain.entities.appoitment import Appointment, AppointmentType, AppointmentReason
from app.scheduler.domain.ports.iappointment_repository import IAppointmentRepository


def _row_to_entity(row: dict[str, Any]) -> Appointment:
    return Appointment(
        id=str(row["id"]),
        calendar_event_id=row.get("calendar_event_id"),
        type=AppointmentType(row["type"]),
        reason=AppointmentReason(row["reason"]),
        date_time=row["date_time"],
        description=row["description"],
        location=row["location"],
        user_id=str(row["user_id"]),
        user_email=row["user_email"],
        created_at=row["created_at"],
    )


class AppointmentRepository(IAppointmentRepository):
    def __init__(self, conn: psycopg2.extensions.connection) -> None:
        self.conn = conn

    def create_appointment(self, appointment: Appointment) -> Appointment:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO appointments (
                    id, calendar_event_id, type, reason, date_time,
                    description, location, user_id, user_email, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    appointment.id,
                    appointment.calendar_event_id,
                    appointment.type.value,
                    appointment.reason.value,
                    appointment.date_time,
                    appointment.description,
                    appointment.location,
                    appointment.user_id,
                    appointment.user_email,
                    appointment.created_at,
                ),
            )
            row = cur.fetchone()
        return _row_to_entity(row)

    def get_appointment_by_id(self, id: str) -> Appointment:
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM appointments WHERE id = %s", (id,))
            row = cur.fetchone()
        if not row:
            raise ValueError(f"Appointment {id} not found")
        return _row_to_entity(row)

    def get_all_appointments(self) -> List[Appointment]:
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM appointments ORDER BY date_time DESC")
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def get_appointments_by_user_id(
        self,
        user_id: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> List[Appointment]:
        query = "SELECT * FROM appointments WHERE user_id = %s"
        params: list[Any] = [user_id]

        if start_date:
            query += " AND date_time >= %s"
            params.append(start_date)
        if end_date:
            query += " AND date_time <= %s"
            params.append(end_date)

        query += " ORDER BY date_time DESC"

        with self.conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def update_appointment(self, appointment: Appointment) -> Appointment:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE appointments
                SET calendar_event_id = %s,
                    type = %s,
                    reason = %s,
                    date_time = %s,
                    description = %s,
                    location = %s,
                    user_id = %s,
                    user_email = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    appointment.calendar_event_id,
                    appointment.type.value,
                    appointment.reason.value,
                    appointment.date_time,
                    appointment.description,
                    appointment.location,
                    appointment.user_id,
                    appointment.user_email,
                    appointment.id,
                ),
            )
            row = cur.fetchone()
        if not row:
            raise ValueError(f"Appointment {appointment.id} not found")
        return _row_to_entity(row)

    def delete_appointment(self, id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM appointments WHERE id = %s RETURNING id", (id,))
            row = cur.fetchone()
        if not row:
            raise ValueError(f"Appointment {id} not found")
