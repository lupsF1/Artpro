"""leads: add status for admin follow-up

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-27

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "leads",
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default=sa.text("'new'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("leads", "status")
