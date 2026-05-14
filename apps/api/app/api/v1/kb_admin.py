"""管理端：知识库文档上传与审核。"""

from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, File, Form, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import delete, func, select

from app.config import get_settings
from app.core.errors import E_NOT_FOUND, E_VALIDATION
from app.core.responses import PaginationMeta, err, ok
from app.deps import AdminUserDep, SessionDep
from app.models import KbChunk, KbDocument
from app.schemas.kb import KbDocumentPatch
from app.services.kb_ingest import ingest_file_to_document

router = APIRouter(prefix="/admin/kb", tags=["admin-kb"])


@router.post("/documents", response_model=None)
async def kb_upload(
    _: AdminUserDep,
    db: SessionDep,
    file: UploadFile = File(...),
    title: str = Form(""),
) -> dict | JSONResponse:
    settings = get_settings()
    fn = (file.filename or "").strip()
    if not fn.lower().endswith((".pdf", ".docx")):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=err(E_VALIDATION, "仅支持 .pdf 或 .docx"),
        )
    raw = await file.read()
    max_b = settings.kb_max_upload_mb * 1024 * 1024
    if len(raw) > max_b:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=err(
                E_VALIDATION,
                f"文件过大（上限 {settings.kb_max_upload_mb} MB）",
            ),
        )
    doc = await ingest_file_to_document(
        db, raw=raw, filename=fn, title_override=title or None
    )
    return ok(
        {
            "id": str(doc.id),
            "title": doc.title,
            "status": doc.status,
            "reviewStatus": doc.review_status,
            "errorMessage": doc.error_message,
        }
    )


@router.get("/documents", response_model=None)
async def kb_list(
    _: AdminUserDep,
    db: SessionDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict:
    total = (
        await db.execute(select(func.count()).select_from(KbDocument))
    ).scalar_one() or 0
    off = (page - 1) * pageSize
    res = await db.execute(
        select(KbDocument)
        .order_by(KbDocument.created_at.desc())
        .offset(off)
        .limit(pageSize)
    )
    rows = res.scalars().all()
    ids = [d.id for d in rows]
    counts: dict[uuid.UUID, int] = {}
    if ids:
        r2 = await db.execute(
            select(KbChunk.document_id, func.count(KbChunk.id))
            .where(KbChunk.document_id.in_(ids))
            .group_by(KbChunk.document_id)
        )
        counts = {did: int(n) for did, n in r2.all()}
    items = [
        {
            "id": str(d.id),
            "title": d.title,
            "sourceFilename": d.source_filename,
            "mimeType": d.mime_type,
            "status": d.status,
            "reviewStatus": d.review_status,
            "errorMessage": d.error_message,
            "chunkCount": counts.get(d.id, 0),
            "createdAt": d.created_at.isoformat(),
            "updatedAt": d.updated_at.isoformat(),
        }
        for d in rows
    ]
    meta = PaginationMeta(page=page, page_size=pageSize, total=total)
    return ok({"items": items, "meta": meta.model_dump(mode="json", by_alias=True)})


@router.get("/documents/{document_id}/chunks", response_model=None)
async def kb_chunks(
    document_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict | JSONResponse:
    d = await db.get(KbDocument, document_id)
    if d is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文档不存在"),
        )
    total = (
        await db.execute(
            select(func.count()).select_from(KbChunk).where(KbChunk.document_id == document_id)
        )
    ).scalar_one() or 0
    off = (page - 1) * pageSize
    res = await db.execute(
        select(KbChunk)
        .where(KbChunk.document_id == document_id)
        .order_by(KbChunk.ordinal.asc())
        .offset(off)
        .limit(pageSize)
    )
    items = []
    for ch in res.scalars().all():
        meta: object | None = None
        if ch.meta_json:
            try:
                meta = json.loads(ch.meta_json)
            except json.JSONDecodeError:
                meta = ch.meta_json
        items.append(
            {
                "id": str(ch.id),
                "ordinal": ch.ordinal,
                "text": ch.text,
                "meta": meta,
                "textLength": len(ch.text),
                "createdAt": ch.created_at.isoformat(),
            }
        )
    meta = PaginationMeta(page=page, page_size=pageSize, total=total)
    return ok(
        {
            "document": {
                "id": str(d.id),
                "title": d.title,
                "status": d.status,
                "reviewStatus": d.review_status,
                "chunkCount": total,
            },
            "items": items,
            "meta": meta.model_dump(mode="json", by_alias=True),
        }
    )


@router.patch("/documents/{document_id}", response_model=None)
async def kb_patch(
    document_id: uuid.UUID,
    data: KbDocumentPatch,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    d = await db.get(KbDocument, document_id)
    if d is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文档不存在"),
        )
    d.review_status = data.review_status
    await db.commit()
    await db.refresh(d)
    return ok(
        {
            "id": str(d.id),
            "reviewStatus": d.review_status,
        }
    )


@router.delete("/documents/{document_id}", response_model=None)
async def kb_delete(
    document_id: uuid.UUID,
    _: AdminUserDep,
    db: SessionDep,
) -> dict | JSONResponse:
    d = await db.get(KbDocument, document_id)
    if d is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=err(E_NOT_FOUND, "文档不存在"),
        )
    await db.execute(delete(KbChunk).where(KbChunk.document_id == document_id))
    await db.execute(delete(KbDocument).where(KbDocument.id == document_id))
    await db.commit()
    return ok({"ok": True})

