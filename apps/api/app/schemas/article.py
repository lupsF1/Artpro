"""文章 schema。"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class ArticleOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    body: str
    excerpt: str | None
    outline: str | None = None
    pipeline_stage: str = "idle"
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("published_at", "created_at", "updated_at")
    def _ser_dt(self, v: datetime | None) -> str | None:
        return v.isoformat() if v else None


class ArticleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    slug: str = Field(min_length=1, max_length=200, pattern=r"^[\w\-]+$")
    body: str = Field(default="")
    excerpt: str | None = None
    outline: str | None = None
    pipeline_stage: str | None = Field(default=None, max_length=32)
    published_at: datetime | None = None  # 可为空=草稿


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = None
    excerpt: str | None = None
    outline: str | None = None
    pipeline_stage: str | None = Field(default=None, max_length=32)
    # 为 null 表示改回草稿（不对外展示）
    published_at: datetime | None = None


class ArticlePipelineBrief(BaseModel):
    """文章流水线：补充说明（可选），供模型理解写作意图。"""

    brief: str = Field(default="", max_length=8000)
