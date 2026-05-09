"""文章 AI 修订快照：按保留时长清理过期记录（后台任务）。"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete

from app.config import get_settings
from app.db import AsyncSessionLocal
from app.models.article_revision import ArticleRevision

logger = logging.getLogger(__name__)


async def purge_article_revisions_older_than(cutoff: datetime) -> int:
    """删除 created_at 早于 cutoff 的修订，返回删除行数。"""
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            delete(ArticleRevision).where(ArticleRevision.created_at < cutoff)
        )
        await session.commit()
        return int(res.rowcount or 0)


async def purge_expired_article_revisions() -> int:
    """按配置保留时长删除过期修订。"""
    s = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(
        hours=s.article_revision_retention_hours
    )
    return await purge_article_revisions_older_than(cutoff)


async def run_revision_cleanup_forever() -> None:
    """间隔执行清理；启动后先执行一轮，再按配置的间隔休眠。"""
    s = get_settings()
    interval = s.article_revision_cleanup_interval_seconds
    while True:
        try:
            n = await purge_expired_article_revisions()
            if n:
                logger.info("article_revisions 定时清理已删除 %s 条", n)
        except Exception:
            logger.exception("article_revisions 定时清理失败")
        await asyncio.sleep(interval)
