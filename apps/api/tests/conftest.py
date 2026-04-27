"""
在 apps/api 内运行 pytest。固定 cwd 为 apps/api，使 sqlite 相对路径与运行时一致。

用法（仓库根或 apps/api 均可）::

    cd /path/to/ArtPro/apps/api && ../../.venv/bin/pytest
"""
from __future__ import annotations

import asyncio
import os
from collections.abc import Generator
from pathlib import Path

import pytest

# 保证 ./data/... 可解析
_API_ROOT = Path(__file__).resolve().parent.parent
os.chdir(_API_ROOT)

_data = _API_ROOT / "data"
_data.mkdir(exist_ok=True)
_test_db = _data / "pytest.db"
if _test_db.exists():
    _test_db.unlink()

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./data/pytest.db"
os.environ["DATABASE_URL_SYNC"] = "sqlite:///./data/pytest.db"


@pytest.fixture(scope="session", autouse=True)
def _init_schema() -> Generator[None, None, None]:
    import app.models  # noqa: F401, register models
    from app.db import engine
    from app.models.base import Base

    async def create() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(create())
    yield
    asyncio.run(engine.dispose())
