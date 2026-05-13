"""知识库文档解析与入库。"""

from __future__ import annotations

import json
import re
from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import KbChunk, KbDocument
from app.services.embeddings import EmbeddingUnavailableError, EmbeddingUpstreamError
from app.services.embeddings import embed_texts
from app.services.kb_chunking import chunk_text, chunk_text_with_page_bounds

_API_ROOT = Path(__file__).resolve().parents[2]


def _safe_filename(name: str, max_len: int = 180) -> str:
    base = (name or "upload").strip()
    base = re.sub(r"[^\w.\-()\u4e00-\u9fff]+", "_", base)
    return base[:max_len] if len(base) > max_len else base


def _parse_pdf(raw: bytes) -> list[tuple[str, dict]]:
    reader = PdfReader(BytesIO(raw))
    page_texts: list[str] = []
    for page in reader.pages:
        try:
            t = page.extract_text() or ""
        except Exception:
            t = ""
        page_texts.append(t)
    return chunk_text_with_page_bounds(page_texts)


def _parse_docx(raw: bytes) -> list[tuple[str, dict]]:
    doc = Document(BytesIO(raw))
    paras: list[str] = []
    for p in doc.paragraphs:
        t = (p.text or "").strip()
        if t:
            paras.append(t)
    text = "\n\n".join(paras)
    pairs = chunk_text(text)
    return [(c, {**m, "source": "docx"}) for c, m in pairs]


async def ingest_file_to_document(
    db: AsyncSession,
    *,
    raw: bytes,
    filename: str,
    title_override: str | None,
) -> KbDocument:
    fn = filename.lower()
    mime: str | None = None
    if fn.endswith(".pdf"):
        mime = "application/pdf"
    elif fn.endswith(".docx"):
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    title = (title_override or "").strip() or Path(filename).stem or "未命名文档"
    doc_row = KbDocument(
        title=title[:500],
        source_type="upload",
        source_filename=filename[:500],
        mime_type=mime,
        status="processing",
        review_status="draft",
    )
    db.add(doc_row)
    await db.flush()

    upload_dir = _API_ROOT / "data" / "kb_uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    spath = upload_dir / f"{doc_row.id}_{_safe_filename(filename)}"
    try:
        spath.write_bytes(raw)
        doc_row.storage_path = str(spath.relative_to(_API_ROOT))
    except OSError:
        doc_row.storage_path = None

    await db.commit()
    await db.refresh(doc_row)

    try:
        if fn.endswith(".pdf"):
            pairs = _parse_pdf(raw)
        elif fn.endswith(".docx"):
            pairs = _parse_docx(raw)
        else:
            doc_row.status = "failed"
            doc_row.error_message = "仅支持 .pdf 或 .docx"
            await db.commit()
            await db.refresh(doc_row)
            return doc_row

        if not pairs:
            doc_row.status = "failed"
            doc_row.error_message = "未能从文档中提取文本（扫描件需 OCR，见文档说明）"
            await db.commit()
            await db.refresh(doc_row)
            return doc_row

        texts = [p[0] for p in pairs]
        batch_size = 16
        all_vecs: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            vecs = await embed_texts(batch)
            all_vecs.extend(vecs)

        for ord_i, ((ctext, meta), vec) in enumerate(zip(pairs, all_vecs, strict=True)):
            ch = KbChunk(
                document_id=doc_row.id,
                ordinal=ord_i,
                text=ctext,
                meta_json=json.dumps(meta, ensure_ascii=False),
                embedding_json=json.dumps(vec, ensure_ascii=False),
            )
            db.add(ch)

        doc_row.status = "ready"
        doc_row.error_message = None
        await db.commit()
        await db.refresh(doc_row)
        return doc_row
    except (EmbeddingUnavailableError, EmbeddingUpstreamError) as e:
        doc_row.status = "failed"
        doc_row.error_message = str(e)[:2000]
        await db.commit()
        await db.refresh(doc_row)
        return doc_row
    except Exception as e:
        doc_row.status = "failed"
        doc_row.error_message = str(e)[:2000]
        await db.commit()
        await db.refresh(doc_row)
        return doc_row
