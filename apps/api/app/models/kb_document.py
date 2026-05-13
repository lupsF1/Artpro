"""知识库文档（艺考咨询助手：上传的 PDF/Word 等）。"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class KbDocument(Base):
    __tablename__ = "kb_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="upload", server_default="upload"
    )
    source_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    # processing | ready | failed
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="processing", server_default="processing"
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # draft | approved（仅 approved 参与 RAG）
    review_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="draft", server_default="draft"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    chunks: Mapped[list["KbChunk"]] = relationship(
        "KbChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )
