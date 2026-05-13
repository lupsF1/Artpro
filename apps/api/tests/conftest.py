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
# 避免 slowapi 在集成测试中误触限流
os.environ["LEADS_RATE_LIMIT"] = "10000/minute"
os.environ["ASSISTANT_RATE_LIMIT"] = "10000/minute"

# 管理端 JWT 与测密码 testpass123（见 apps/api/tests/test_v1.py）
os.environ["ADMIN_JWT_SECRET"] = "0" * 32
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD_HASH"] = (
    "$2b$12$8p6z0uFObfvaQ9h.Tkg0IO/CJT7GgTGtK/lUDKh3tId4c4KQiH13S"
)
os.environ["ARTICLE_REVISION_CLEANUP_ENABLED"] = "false"


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
