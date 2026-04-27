"""站点配置（管理端更新）。"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SiteConfigUpdate(BaseModel):
    siteName: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=64)
    address: str | None = Field(default=None, max_length=2000)
    icp: str | None = Field(default=None, max_length=200)
