from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from app.core.errors import E_NOT_FOUND
from app.core.responses import PaginationMeta, err, ok
from app.deps import SessionDep
from app.models import Article

router = APIRouter(tags=["content"])


@router.get("/articles")
async def list_articles(
    db: SessionDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict:
    """已发布文章列表（`published_at` 非空且不晚于当前时间）。"""
    now = datetime.now(UTC)
    where = (Article.published_at.isnot(None), Article.published_at <= now)
    total = (
        await db.execute(
            select(func.count()).select_from(Article).where(*where),
        )
    ).scalar_one() or 0
    off = (page - 1) * pageSize
    res = await db.execute(
        select(Article)
        .where(*where)
        .order_by(Article.published_at.desc())
        .offset(off)
        .limit(pageSize),
    )
    rows = res.scalars().all()
    items: list[dict] = [
        {
            "id": str(a.id),
            "title": a.title,
            "slug": a.slug,
            "excerpt": a.excerpt,
            "publishedAt": a.published_at.isoformat() if a.published_at else None,
        }
        for a in rows
    ]
    meta = PaginationMeta(page=page, page_size=pageSize, total=total)
    return ok(
        {
            "items": items,
            "meta": meta.model_dump(mode="json", by_alias=True),
        },
    )


@router.get("/articles/{article_slug}", response_model=None)
async def get_article_by_slug(article_slug: str, db: SessionDep) -> dict | JSONResponse:
    """单篇已发布文章（供官网资讯详情页，按 `slug`）。"""
    if not article_slug or len(article_slug) > 200:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    now = datetime.now(UTC)
    r = await db.execute(
        select(Article).where(
            Article.slug == article_slug,
            Article.published_at.isnot(None),
            Article.published_at <= now,
        ),
    )
    a = r.scalar_one_or_none()
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    return ok(
        {
            "id": str(a.id),
            "title": a.title,
            "slug": a.slug,
            "body": a.body,
            "excerpt": a.excerpt,
            "publishedAt": a.published_at.isoformat() if a.published_at else None,
        },
    )
