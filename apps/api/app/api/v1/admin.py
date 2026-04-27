"""受保护的管理端接口：线索、站点、文章。"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.core.errors import E_CONFLICT, E_INTERNAL, E_NOT_FOUND
from app.core.responses import PaginationMeta, err, ok
from app.deps import AdminUserDep, SessionDep
from app.models import Article, Lead
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate
from app.schemas.lead import LeadOut, LeadPatch
from app.schemas.site import SiteConfigUpdate
from app.services.site_config import get_or_create_row

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/leads", response_model=None)
async def list_leads(
    _: AdminUserDep,
    db: SessionDep,
    page: int = Query(1, ge=1, description="从 1 起"),
    pageSize: int = Query(20, ge=1, le=100, description="每页条数"),
) -> dict | JSONResponse:
    try:
        total = (
            await db.execute(select(func.count()).select_from(Lead))
        ).scalar_one() or 0
        off = (page - 1) * pageSize
        result = await db.execute(
            select(Lead)
            .order_by(Lead.created_at.desc())
            .offset(off)
            .limit(pageSize),
        )
        rows = result.scalars().all()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "查询失败"),
        )
    items = [LeadOut.model_validate(x).model_dump() for x in rows]
    meta = PaginationMeta(page=page, page_size=pageSize, total=total)
    return ok(
        {
            "items": items,
            "meta": meta.model_dump(mode="json", by_alias=True),
        }
    )


@router.patch("/leads/{lead_id}", response_model=None)
async def patch_lead(
    lead_id: uuid.UUID,
    _: AdminUserDep,
    data: LeadPatch,
    db: SessionDep,
) -> dict | JSONResponse:
    try:
        lead = await db.get(Lead, lead_id)
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "更新失败"),
        )
    if lead is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "线索不存在"),
        )
    lead.status = data.status.strip() or "new"
    try:
        await db.commit()
        await db.refresh(lead)
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "更新失败"),
        )
    return ok(LeadOut.model_validate(lead).model_dump())


@router.put("/site/config", response_model=None)
async def put_site_config(
    data: SiteConfigUpdate,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    try:
        row = await get_or_create_row(db)
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "读取配置失败"),
        )
    d = data.model_dump(exclude_unset=True)
    if "siteName" in d and d["siteName"] is not None:
        row.site_name = d["siteName"].strip()
    if "phone" in d:
        row.phone = (d.get("phone") or "").strip() or None
    if "address" in d:
        row.address = (d.get("address") or "").strip() or None
    if "icp" in d:
        row.icp = (d.get("icp") or "").strip() or None
    try:
        await db.commit()
        await db.refresh(row)
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "保存配置失败"),
        )
    return ok(
        {
            "siteName": row.site_name,
            "phone": row.phone,
            "address": row.address,
            "icp": row.icp,
        },
    )


@router.get("/articles", response_model=None)
async def list_admin_articles(
    _: AdminUserDep,
    db: SessionDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict | JSONResponse:
    try:
        total = (
            await db.execute(select(func.count()).select_from(Article))
        ).scalar_one() or 0
        off = (page - 1) * pageSize
        res = await db.execute(
            select(Article)
            .order_by(Article.updated_at.desc())
            .offset(off)
            .limit(pageSize),
        )
        rows = res.scalars().all()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "查询失败"),
        )
    return ok(
        {
            "items": [ArticleOut.model_validate(x).model_dump() for x in rows],
            "meta": PaginationMeta(
                page=page, page_size=pageSize, total=total
            ).model_dump(mode="json", by_alias=True),
        }
    )


@router.get("/articles/{article_id}", response_model=None)
async def get_admin_article(
    article_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    a = await db.get(Article, article_id)
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    return ok(ArticleOut.model_validate(a).model_dump())


@router.post("/articles", response_model=None)
async def create_article(
    data: ArticleCreate,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    a = Article(
        title=data.title.strip(),
        slug=data.slug.strip(),
        body=data.body,
        excerpt=(data.excerpt or "").strip() or None,
        published_at=data.published_at,
    )
    try:
        db.add(a)
        await db.commit()
        await db.refresh(a)
    except IntegrityError:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=err(E_CONFLICT, "slug 已存在"),
        )
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "创建失败"),
        )
    return ok(ArticleOut.model_validate(a).model_dump())


@router.put("/articles/{article_id}", response_model=None)
async def update_article(
    article_id: uuid.UUID,
    data: ArticleUpdate,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    a = await db.get(Article, article_id)
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    d = data.model_dump(exclude_unset=True)
    if "title" in d and d["title"] is not None:
        a.title = d["title"].strip()
    if "slug" in d and d["slug"] is not None:
        a.slug = d["slug"].strip()
    if "body" in d:
        a.body = d.get("body") if d.get("body") is not None else ""
    if "excerpt" in d:
        a.excerpt = d.get("excerpt")
    if "published_at" in d:
        a.published_at = d.get("published_at")
    a.updated_at = datetime.now(timezone.utc)
    try:
        await db.commit()
        await db.refresh(a)
    except IntegrityError:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=err(E_CONFLICT, "slug 已存在"),
        )
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "更新失败"),
        )
    return ok(ArticleOut.model_validate(a).model_dump())


@router.delete("/articles/{article_id}", response_model=None)
async def delete_article(
    article_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    a = await db.get(Article, article_id)
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    try:
        await db.delete(a)  # SQLAlchemy 2.0 async session
        await db.commit()
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "删除失败"),
        )
    return ok({"ok": True})
