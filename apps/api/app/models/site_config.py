"""单条站点配置行（id 固定为 1）。"""

from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SiteConfig(Base):
    __tablename__ = "site_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    site_name: Mapped[str] = mapped_column(String(200), nullable=False, default="丝育教育")
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    icp: Mapped[str | None] = mapped_column(String(200), nullable=True)
