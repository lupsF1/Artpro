"""article_revisions 表（流水线第二版：生成快照与采用）

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import Uuid

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "article_revisions",
        sa.Column("id", Uuid(as_uuid=True), nullable=False),
        sa.Column("article_id", Uuid(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source", sa.String(32), nullable=False, server_default="ai"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["article_id"],
            ["articles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_article_revisions_article_kind_created",
        "article_revisions",
        ["article_id", "kind", "created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_article_revisions_article_id"),
        "article_revisions",
        ["article_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_article_revisions_article_id"), table_name="article_revisions")
    op.drop_index("ix_article_revisions_article_kind_created", table_name="article_revisions")
    op.drop_table("article_revisions")
