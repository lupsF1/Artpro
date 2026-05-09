"""受保护的管理端接口：线索、站点、文章。"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.core.errors import E_AI_UNAVAILABLE, E_CONFLICT, E_INTERNAL, E_NOT_FOUND, E_VALIDATION
from app.core.responses import PaginationMeta, err, ok
from app.deps import AdminUserDep, SessionDep
from app.db import AsyncSessionLocal
from app.models import Article, ArticleRevision, Lead
from app.schemas.article import (
    ArticleCreate,
    ArticleOut,
    ArticlePipelineBrief,
    ArticleRevisionOut,
    ArticleUpdate,
    REVISION_KINDS,
)
from app.schemas.lead import LeadAdminCreate, LeadOut, LeadPatch, LeadUpdate
from app.schemas.site import SiteConfigUpdate
from app.services.article_pipeline import (
    _normalize_outline_markdown,
    _strip_outer_code_fence,
    stream_body_deltas,
    stream_excerpt_deltas,
    stream_outline_deltas,
)
from app.services.llm_openai import LLMUnavailableError, LLMUpstreamError
from app.services.site_config import get_or_create_row

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

_PIPELINE_STAGES = frozenset({"idle", "outlined", "drafted", "excerpted"})


def _norm_pipeline_stage(raw: str | None) -> str:
    if not raw:
        return "idle"
    s = raw.strip()
    return s if s in _PIPELINE_STAGES else "idle"


def _norm_revision_kind(raw: str) -> str | None:
    k = (raw or "").strip().lower()
    return k if k in REVISION_KINDS else None


def _sse_line(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


def _stream_pipeline_error_message(prefix: str, exc: BaseException) -> str:
    detail = (str(exc) or "").strip() or type(exc).__name__
    msg = f"{prefix}（{detail}）"
    return msg if len(msg) <= 800 else msg[:797] + "..."


def _llm_not_configured() -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=err(
            E_AI_UNAVAILABLE,
            "未配置 AI：请设置环境变量 OPENAI_API_KEY 或 MIMO_API_KEY（小米 MiMo）",
        ),
    )


_STREAM_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


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


@router.post("/leads", response_model=None)
async def create_lead_admin(
    _: AdminUserDep,
    data: LeadAdminCreate,
    db: SessionDep,
) -> dict | JSONResponse:
    lead = Lead(
        name=data.name.strip(),
        phone=data.phone.strip(),
        wechat=(data.wechat or "").strip() or None,
        message=(data.message or "").strip() or None,
        source=(data.source or "").strip() or "admin",
        status=(data.status or "new").strip() or "new",
    )
    try:
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "创建失败"),
        )
    return ok(LeadOut.model_validate(lead).model_dump())


@router.get("/leads/{lead_id}", response_model=None)
async def get_lead(
    lead_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    lead = await db.get(Lead, lead_id)
    if lead is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "预约信息不存在"),
        )
    return ok(LeadOut.model_validate(lead).model_dump())


@router.put("/leads/{lead_id}", response_model=None)
async def put_lead(
    lead_id: uuid.UUID,
    _: AdminUserDep,
    data: LeadUpdate,
    db: SessionDep,
) -> dict | JSONResponse:
    lead = await db.get(Lead, lead_id)
    if lead is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "预约信息不存在"),
        )
    payload = data.model_dump(exclude_unset=True)
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=err(E_VALIDATION, "请至少提供一个要更新的字段"),
        )
    if "name" in payload:
        lead.name = str(payload["name"]).strip()
    if "phone" in payload:
        lead.phone = str(payload["phone"]).strip()
    if "wechat" in payload:
        w = payload["wechat"]
        lead.wechat = (str(w).strip() or None) if w is not None else None
    if "message" in payload:
        m = payload["message"]
        lead.message = (str(m).strip() or None) if m is not None else None
    if "source" in payload:
        s = payload["source"]
        lead.source = (str(s).strip() or None) if s is not None else None
    if "status" in payload:
        lead.status = str(payload["status"]).strip() or "new"
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


@router.delete("/leads/{lead_id}", response_model=None)
async def delete_lead(
    lead_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    lead = await db.get(Lead, lead_id)
    if lead is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "预约信息不存在"),
        )
    try:
        await db.delete(lead)
        await db.commit()
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "删除失败"),
        )
    return ok({"ok": True})


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
            content=err(E_NOT_FOUND, "预约信息不存在"),
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
        outline=(data.outline or "").strip() or None,
        pipeline_stage=_norm_pipeline_stage(data.pipeline_stage),
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
    if "outline" in d:
        ov = d.get("outline")
        if ov is None:
            a.outline = None
        else:
            a.outline = str(ov).strip() or None
    if "pipeline_stage" in d:
        a.pipeline_stage = _norm_pipeline_stage(d.get("pipeline_stage"))
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


@router.post("/articles/{article_id}/pipeline/outline", response_model=None)
async def article_pipeline_outline(
    article_id: uuid.UUID,
    data: ArticlePipelineBrief,
    _: AdminUserDep,
) -> StreamingResponse | JSONResponse:
    if not get_settings().resolved_llm_api_key():
        return _llm_not_configured()

    async with AsyncSessionLocal() as db0:
        a0 = await db0.get(Article, article_id)
        if a0 is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=err(E_NOT_FOUND, "文章不存在"),
            )
        aid = a0.id
        brief = data.brief

    async def events():
        async with AsyncSessionLocal() as db:
            a = await db.get(Article, aid)
            if a is None:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_NOT_FOUND,
                        "message": "文章不存在",
                    }
                )
                return
            parts: list[str] = []
            try:
                async for delta in stream_outline_deltas(a, brief):
                    parts.append(delta)
                    yield _sse_line({"type": "delta", "text": delta})
                outline = _normalize_outline_markdown(
                    _strip_outer_code_fence("".join(parts))
                )
                rev = ArticleRevision(
                    article_id=a.id,
                    kind="outline",
                    content=outline,
                    source="ai",
                )
                db.add(rev)
                await db.commit()
                await db.refresh(rev)
                await db.refresh(a)
                yield _sse_line(
                    {
                        "type": "done",
                        "revision": ArticleRevisionOut.model_validate(rev).model_dump(
                            mode="json"
                        ),
                        "article": ArticleOut.model_validate(a).model_dump(mode="json"),
                    }
                )
            except LLMUnavailableError:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_AI_UNAVAILABLE,
                        "message": "未配置 AI：请设置环境变量 OPENAI_API_KEY 或 MIMO_API_KEY（小米 MiMo）",
                    }
                )
            except LLMUpstreamError as e:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"模型服务异常：{e}",
                    }
                )
            except Exception as e:
                logger.exception("article_pipeline_outline failed")
                try:
                    await db.rollback()
                except Exception:
                    pass
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": _stream_pipeline_error_message(
                            "生成大纲失败", e
                        ),
                    },
                )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers=dict(_STREAM_HEADERS),
    )


@router.post("/articles/{article_id}/pipeline/body", response_model=None)
async def article_pipeline_body(
    article_id: uuid.UUID,
    data: ArticlePipelineBrief,
    _: AdminUserDep,
) -> StreamingResponse | JSONResponse:
    if not get_settings().resolved_llm_api_key():
        return _llm_not_configured()

    async with AsyncSessionLocal() as db0:
        a0 = await db0.get(Article, article_id)
        if a0 is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=err(E_NOT_FOUND, "文章不存在"),
            )
        aid = a0.id
        brief = data.brief

    async def events():
        async with AsyncSessionLocal() as db:
            a = await db.get(Article, aid)
            if a is None:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_NOT_FOUND,
                        "message": "文章不存在",
                    }
                )
                return
            parts: list[str] = []
            try:
                async for delta in stream_body_deltas(a, brief):
                    parts.append(delta)
                    yield _sse_line({"type": "delta", "text": delta})
                body = _strip_outer_code_fence("".join(parts))
                rev = ArticleRevision(
                    article_id=a.id,
                    kind="body",
                    content=body,
                    source="ai",
                )
                db.add(rev)
                await db.commit()
                await db.refresh(rev)
                await db.refresh(a)
                yield _sse_line(
                    {
                        "type": "done",
                        "revision": ArticleRevisionOut.model_validate(rev).model_dump(
                            mode="json"
                        ),
                        "article": ArticleOut.model_validate(a).model_dump(mode="json"),
                    }
                )
            except LLMUnavailableError:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_AI_UNAVAILABLE,
                        "message": "未配置 AI：请设置环境变量 OPENAI_API_KEY 或 MIMO_API_KEY（小米 MiMo）",
                    }
                )
            except LLMUpstreamError as e:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"模型服务异常：{e}",
                    }
                )
            except Exception as e:
                logger.exception("article_pipeline_body failed")
                try:
                    await db.rollback()
                except Exception:
                    pass
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": _stream_pipeline_error_message(
                            "生成正文失败", e
                        ),
                    },
                )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers=dict(_STREAM_HEADERS),
    )


@router.post("/articles/{article_id}/pipeline/excerpt", response_model=None)
async def article_pipeline_excerpt(
    article_id: uuid.UUID,
    _: AdminUserDep,
) -> StreamingResponse | JSONResponse:
    if not get_settings().resolved_llm_api_key():
        return _llm_not_configured()

    async with AsyncSessionLocal() as db0:
        a0 = await db0.get(Article, article_id)
        if a0 is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=err(E_NOT_FOUND, "文章不存在"),
            )
        if not (a0.body or "").strip():
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content=err(E_VALIDATION, "正文为空，无法生成摘要"),
            )
        aid = a0.id

    async def events():
        async with AsyncSessionLocal() as db:
            a = await db.get(Article, aid)
            if a is None:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_NOT_FOUND,
                        "message": "文章不存在",
                    }
                )
                return
            parts: list[str] = []
            try:
                async for delta in stream_excerpt_deltas(a):
                    parts.append(delta)
                    yield _sse_line({"type": "delta", "text": delta})
                raw = "".join(parts)
                excerpt = raw.replace("\n", " ").strip()
                if len(excerpt) > 500:
                    excerpt = excerpt[:500]
                rev = ArticleRevision(
                    article_id=a.id,
                    kind="excerpt",
                    content=excerpt[:2000],
                    source="ai",
                )
                db.add(rev)
                await db.commit()
                await db.refresh(rev)
                await db.refresh(a)
                yield _sse_line(
                    {
                        "type": "done",
                        "revision": ArticleRevisionOut.model_validate(rev).model_dump(
                            mode="json"
                        ),
                        "article": ArticleOut.model_validate(a).model_dump(mode="json"),
                    }
                )
            except ValueError as e:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_VALIDATION,
                        "message": str(e) or "正文为空，无法生成摘要",
                    }
                )
            except LLMUnavailableError:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_AI_UNAVAILABLE,
                        "message": "未配置 AI：请设置环境变量 OPENAI_API_KEY 或 MIMO_API_KEY（小米 MiMo）",
                    }
                )
            except LLMUpstreamError as e:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"模型服务异常：{e}",
                    }
                )
            except Exception as e:
                logger.exception("article_pipeline_excerpt failed")
                try:
                    await db.rollback()
                except Exception:
                    pass
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": _stream_pipeline_error_message(
                            "生成摘要失败", e
                        ),
                    },
                )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers=dict(_STREAM_HEADERS),
    )


@router.get("/articles/{article_id}/revisions", response_model=None)
async def list_article_revisions(
    article_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
    kind: str = Query(..., description="outline、body 或 excerpt"),
    limit: int = Query(50, ge=1, le=100),
) -> dict | JSONResponse:
    k = _norm_revision_kind(kind)
    if not k:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=err(E_VALIDATION, "kind 须为 outline、body 或 excerpt"),
        )
    a = await db.get(Article, article_id)
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    try:
        res = await db.execute(
            select(ArticleRevision)
            .where(
                ArticleRevision.article_id == article_id,
                ArticleRevision.kind == k,
            )
            .order_by(ArticleRevision.created_at.desc())
            .limit(limit),
        )
        rows = res.scalars().all()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "查询失败"),
        )
    return ok(
        {
            "items": [
                ArticleRevisionOut.model_validate(x).model_dump() for x in rows
            ],
        }
    )


@router.post("/articles/{article_id}/revisions/{revision_id}/apply", response_model=None)
async def apply_article_revision(
    article_id: uuid.UUID,
    revision_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    a = await db.get(Article, article_id)
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    r = await db.get(ArticleRevision, revision_id)
    if r is None or r.article_id != article_id:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "修订不存在"),
        )
    if r.kind == "outline":
        a.outline = r.content
        a.pipeline_stage = "outlined"
    elif r.kind == "body":
        a.body = r.content
        a.pipeline_stage = "drafted"
    elif r.kind == "excerpt":
        a.excerpt = (r.content or "")[:2000] or None
        a.pipeline_stage = "excerpted"
    else:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=err(E_VALIDATION, "修订类型无效"),
        )
    a.updated_at = datetime.now(timezone.utc)
    try:
        await db.commit()
        await db.refresh(a)
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "应用修订失败"),
        )
    return ok(ArticleOut.model_validate(a).model_dump())


@router.delete("/articles/{article_id}/revisions/{revision_id}", response_model=None)
async def delete_article_revision(
    article_id: uuid.UUID,
    revision_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    a = await db.get(Article, article_id)
    if a is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文章不存在"),
        )
    r = await db.get(ArticleRevision, revision_id)
    if r is None or r.article_id != article_id:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "修订不存在"),
        )
    try:
        await db.delete(r)
        await db.commit()
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "删除修订失败"),
        )
    return ok({"ok": True})
