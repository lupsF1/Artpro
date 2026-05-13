"""知识库向量召回（Python 端余弦相似度）。"""

from __future__ import annotations

import json
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import KbChunk, KbDocument
from app.services.embeddings import cosine_similarity, embed_texts


@dataclass
class RetrievedSnippet:
    chunk_id: UUID
    document_id: UUID
    document_title: str
    text: str
    score: float
    meta: dict


async def retrieve_snippets(
    db: AsyncSession, query: str
) -> list[RetrievedSnippet]:
    q = (query or "").strip()
    if not q:
        return []

    settings = get_settings()
    qvec = (await embed_texts([q]))[0]

    stmt = (
        select(KbChunk, KbDocument)
        .join(KbDocument, KbChunk.document_id == KbDocument.id)
        .where(
            and_(
                KbDocument.status == "ready",
                KbDocument.review_status == "approved",
                KbChunk.embedding_json.isnot(None),
                KbChunk.text != "",
            )
        )
    )
    res = await db.execute(stmt)
    rows = res.all()

    scored: list[tuple[float, KbChunk, KbDocument]] = []
    for ch, doc in rows:
        try:
            vec = json.loads(ch.embedding_json or "null")
        except json.JSONDecodeError:
            continue
        if not isinstance(vec, list) or not vec:
            continue
        sim = cosine_similarity(qvec, [float(x) for x in vec])
        if sim >= settings.rag_min_cosine:
            scored.append((sim, ch, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[: settings.rag_top_k]

    out: list[RetrievedSnippet] = []
    for sim, ch, doc in top:
        meta: dict = {}
        if ch.meta_json:
            try:
                meta = json.loads(ch.meta_json)
            except json.JSONDecodeError:
                meta = {}
        if not isinstance(meta, dict):
            meta = {}
        out.append(
            RetrievedSnippet(
                chunk_id=ch.id,
                document_id=doc.id,
                document_title=doc.title,
                text=ch.text,
                score=sim,
                meta=meta,
            )
        )
    return out


def snippets_to_prompt_block(snippets: list[RetrievedSnippet]) -> str:
    if not snippets:
        return "（当前知识库中无匹配摘录。请明确告知用户你未在知识库中找到相关内容，并建议通过官网「预约咨询」联系老师。禁止编造政策、分数线与升学承诺。）"
    lines: list[str] = []
    for i, s in enumerate(snippets, start=1):
        page = s.meta.get("page")
        loc = f"第{page}页" if isinstance(page, int) else "节选"
        excerpt = s.text.strip()
        if len(excerpt) > 1200:
            excerpt = excerpt[:1197] + "..."
        lines.append(
            f"[{i}] 来源文档《{s.document_title}》（{loc}，相关度约 {s.score:.2f}）\n{excerpt}"
        )
    return "\n\n".join(lines)
