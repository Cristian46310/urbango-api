"""create appointments table

Revision ID: 6eeaeeb3b21b
Revises:
Create Date: 2026-06-07

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "6eeaeeb3b21b"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("calendar_event_id", sa.String(), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("date_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("description", sa.String(300), nullable=False, server_default=""),
        sa.Column("location", sa.String(), nullable=False, server_default=""),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_appointments_user_id", "appointments", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_appointments_user_id", table_name="appointments")
    op.drop_table("appointments")
