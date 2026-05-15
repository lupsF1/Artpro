"""知识库混合检索：元数据识别 + 稠密召回 + BM25 + 重排序。"""

from __future__ import annotations

import asyncio
import json
import math
import re
from collections import Counter
from dataclasses import dataclass
from uuid import UUID

import httpx
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


@dataclass
class Candidate:
    chunk: KbChunk
    document: KbDocument
    meta: dict
    dense_score: float = 0.0
    bm25_score: float = 0.0
    final_score: float = 0.0


@dataclass
class QueryMetadataFilter:
    degree_type: str | None = None
    research_direction_terms: list[str] | None = None
    exam_subject_terms: list[str] | None = None
    outline_terms: list[str] | None = None
    section_terms: list[str] | None = None

    def has_filters(self) -> bool:
        return any(
            [
                self.degree_type,
                self.research_direction_terms,
                self.exam_subject_terms,
                self.outline_terms,
                self.section_terms,
            ]
        )


_WORD_RE = re.compile(r"[A-Za-z0-9]+|[\u4e00-\u9fff]")
_SUBJECT_RE = re.compile(r"(?<!\d)\d{3,4}[\u4e00-\u9fffA-Za-z]*")
_DIRECTION_RE = re.compile(r"(?<!\d)\d{2}[\u4e00-\u9fffA-Za-z]+")


def _parse_meta(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        meta = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return meta if isinstance(meta, dict) else {}


def _as_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(_as_text(v) for v in value)
    if isinstance(value, dict):
        return " ".join(_as_text(v) for v in value.values())
    return str(value)


def _candidate_text(ch: KbChunk, doc: KbDocument, meta: dict) -> str:
    return "\n".join(
        [
            doc.title or "",
            ch.text or "",
            _as_text(meta.get("breadcrumb")),
            _as_text(meta.get("degreeType")),
            _as_text(meta.get("researchDirections")),
            _as_text(meta.get("examSubjects")),
            _as_text(meta.get("outlineName")),
            _as_text(meta.get("sectionTitle")),
            _as_text(meta.get("subsectionTitle")),
        ]
    )


def _tokenize(text: str) -> list[str]:
    raw = [m.group(0).lower() for m in _WORD_RE.finditer(text or "")]
    cjk_chars = [t for t in raw if re.fullmatch(r"[\u4e00-\u9fff]", t)]
    bigrams = [a + b for a, b in zip(cjk_chars, cjk_chars[1:])]
    return raw + bigrams


def infer_query_metadata_filter(query: str) -> QueryMetadataFilter:
    q = query or ""
    degree = None
    if "学术学位" in q:
        degree = "学术学位"
    elif "专业学位" in q:
        degree = "专业学位"

    outline_terms = re.findall(r"《([^》]+)》", q)
    for term in ("考试大纲", "招生简章"):
        if term in q and term not in outline_terms:
            outline_terms.append(term)

    section_terms = []
    for term in ("考试目的", "考试基本要求", "考试内容", "报名条件", "考试科目", "研究方向"):
        if term in q:
            section_terms.append(term)

    _SPLIT_RE = re.compile(r"(?:考试|内容|要求|是什么|有哪些|考什么|怎么|哪些|什么|的|吗|呢)")
    subject_terms = [
        _SPLIT_RE.split(term, maxsplit=1)[0]
        for term in _SUBJECT_RE.findall(q)
    ]
    if not subject_terms:
        for term in ("艺术理论", "中外艺术史"):
            if term in q and term not in subject_terms:
                subject_terms.append(term)
    else:
        for term in ("艺术理论", "中外艺术史"):
            if term in q and not any(term in subject for subject in subject_terms):
                subject_terms.append(term)

    direction_terms = [
        _SPLIT_RE.split(term, maxsplit=1)[0]
        for term in _DIRECTION_RE.findall(q)
    ]
    for term in ("艺术管理", "艺术遗产"):
        if term in q and term not in direction_terms:
            direction_terms.append(term)

    return QueryMetadataFilter(
        degree_type=degree,
        research_direction_terms=direction_terms or None,
        exam_subject_terms=subject_terms or None,
        outline_terms=outline_terms or None,
        section_terms=section_terms or None,
    )


def _matches_terms(haystack: str, terms: list[str] | None) -> bool:
    if not terms:
        return True
    haystack_no_space = haystack.replace(" ", "")
    return any(term and (term in haystack or term in haystack_no_space) for term in terms)


def _metadata_bonus_score(candidate: Candidate, filters: QueryMetadataFilter) -> float:
    if not filters.has_filters():
        return 0.0
    meta = candidate.meta
    haystack = "\n".join([candidate.document.title or "", candidate.chunk.text or "", _as_text(meta)])
    research_text = _as_text(meta.get("researchDirections")) or haystack
    subject_text = _as_text(meta.get("examSubjects")) or haystack
    outline_text = _as_text(meta.get("outlineName")) or haystack
    section_text = "\n".join(
        [
            _as_text(meta.get("sectionTitle")),
            _as_text(meta.get("subsectionTitle")),
            candidate.chunk.text or "",
        ]
    )
    matched = 0
    total = 0
    if filters.degree_type:
        total += 1
        if filters.degree_type in haystack:
            matched += 1
    if filters.research_direction_terms:
        total += 1
        if _matches_terms(research_text, filters.research_direction_terms):
            matched += 1
    if filters.exam_subject_terms:
        total += 1
        if _matches_terms(subject_text, filters.exam_subject_terms):
            matched += 1
    if filters.outline_terms:
        total += 1
        if _matches_terms(outline_text, filters.outline_terms):
            matched += 1
    if filters.section_terms:
        total += 1
        if _matches_terms(section_text, filters.section_terms):
            matched += 1
    if total > 0:
        return 0.15 * (matched / total)
    return 0.0


async def _load_search_corpus(db: AsyncSession) -> list[Candidate]:
    stmt = (
        select(KbChunk, KbDocument)
        .join(KbDocument, KbChunk.document_id == KbDocument.id)
        .where(
            and_(
                KbDocument.status == "ready",
                KbDocument.review_status == "approved",
                KbChunk.text != "",
            )
        )
    )
    res = await db.execute(stmt)
    return [
        Candidate(chunk=ch, document=doc, meta=_parse_meta(ch.meta_json))
        for ch, doc in res.all()
    ]


async def _dense_recall(query: str, corpus: list[Candidate], top_k: int) -> list[Candidate]:
    qvec = (await embed_texts([query], task="query"))[0]
    scored: list[Candidate] = []
    for item in corpus:
        try:
            vec = json.loads(item.chunk.embedding_json or "null")
        except json.JSONDecodeError:
            continue
        if not isinstance(vec, list) or not vec:
            continue
        item.dense_score = cosine_similarity(qvec, [float(x) for x in vec])
        scored.append(item)
    scored.sort(key=lambda x: x.dense_score, reverse=True)
    return scored[:top_k]


def _bm25_recall(query: str, corpus: list[Candidate], top_k: int) -> list[Candidate]:
    query_terms = _tokenize(query)
    if not query_terms:
        return []
    docs_tokens = [_tokenize(_candidate_text(c.chunk, c.document, c.meta)) for c in corpus]
    doc_count = len(docs_tokens)
    if doc_count == 0:
        return []
    avgdl = sum(len(tokens) for tokens in docs_tokens) / doc_count
    df: Counter[str] = Counter()
    for tokens in docs_tokens:
        df.update(set(tokens))
    k1 = 1.5
    b = 0.75
    scored: list[Candidate] = []
    for candidate, tokens in zip(corpus, docs_tokens, strict=True):
        tf = Counter(tokens)
        dl = len(tokens) or 1
        score = 0.0
        for term in query_terms:
            if tf[term] == 0:
                continue
            idf = math.log(1 + (doc_count - df[term] + 0.5) / (df[term] + 0.5))
            denom = tf[term] + k1 * (1 - b + b * dl / (avgdl or 1))
            score += idf * (tf[term] * (k1 + 1)) / denom
        if score > 0:
            candidate.bm25_score = score
            scored.append(candidate)
    scored.sort(key=lambda x: x.bm25_score, reverse=True)
    return scored[:top_k]


def _merge_candidates(*groups: list[Candidate]) -> list[Candidate]:
    merged: dict[UUID, Candidate] = {}
    for group in groups:
        for item in group:
            existing = merged.get(item.chunk.id)
            if existing is None:
                merged[item.chunk.id] = item
            else:
                existing.dense_score = max(existing.dense_score, item.dense_score)
                existing.bm25_score = max(existing.bm25_score, item.bm25_score)
    return list(merged.values())


def _normalize_scores(candidates: list[Candidate], attr: str) -> dict[UUID, float]:
    values = [float(getattr(c, attr)) for c in candidates]
    max_value = max(values, default=0.0)
    if max_value <= 0:
        return {c.chunk.id: 0.0 for c in candidates}
    return {c.chunk.id: float(getattr(c, attr)) / max_value for c in candidates}


def _cross_feature_score(query: str, candidate: Candidate) -> float:
    query_terms = set(_tokenize(query))
    text_terms = set(_tokenize(_candidate_text(candidate.chunk, candidate.document, candidate.meta)))
    overlap = len(query_terms & text_terms) / max(1, len(query_terms))
    breadcrumb_text = _as_text(candidate.meta.get("breadcrumb"))
    breadcrumb_bonus = 0.15 if any(term in breadcrumb_text for term in query_terms) else 0.0
    return overlap + breadcrumb_bonus


async def _external_rerank_candidates(
    query: str,
    candidates: list[Candidate],
) -> list[Candidate] | None:
    settings = get_settings()
    base = (settings.reranker_base_url or "").strip().rstrip("/")
    if not base:
        return None
    documents = [_candidate_text(c.chunk, c.document, c.meta) for c in candidates]
    headers = {"Content-Type": "application/json"}
    key = (settings.reranker_api_key or "").strip()
    if key:
        headers["Authorization"] = f"Bearer {key}"
    payload = {
        "model": (settings.reranker_model or "").strip() or None,
        "query": query,
        "documents": documents,
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(f"{base}/rerank", json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
    except Exception:
        return None
    results = data.get("results") if isinstance(data, dict) else None
    if not isinstance(results, list):
        return None
    by_index: dict[int, float] = {}
    for item in results:
        if not isinstance(item, dict):
            continue
        index = item.get("index")
        score = item.get("relevance_score", item.get("score"))
        if isinstance(index, int) and isinstance(score, (int, float)):
            by_index[index] = float(score)
    if not by_index:
        return None
    out: list[Candidate] = []
    for index, candidate in enumerate(candidates):
        if index in by_index:
            candidate.final_score = by_index[index]
            out.append(candidate)
    out.sort(key=lambda x: x.final_score, reverse=True)
    return out or None


async def _rerank_candidates(
    query: str,
    candidates: list[Candidate],
    filters: QueryMetadataFilter | None = None,
) -> list[Candidate]:
    external = await _external_rerank_candidates(query, candidates)
    if external is not None:
        return external
    dense_norm = _normalize_scores(candidates, "dense_score")
    bm25_norm = _normalize_scores(candidates, "bm25_score")
    for item in candidates:
        cross = _cross_feature_score(query, item)
        meta_bonus = _metadata_bonus_score(item, filters) if filters else 0.0
        item.final_score = (
            0.45 * dense_norm[item.chunk.id]
            + 0.35 * bm25_norm[item.chunk.id]
            + 0.20 * cross
            + meta_bonus
        )
    candidates.sort(key=lambda x: x.final_score, reverse=True)
    return candidates


async def retrieve_snippets(
    db: AsyncSession, query: str
) -> list[RetrievedSnippet]:
    q = (query or "").strip()
    if not q:
        return []

    settings = get_settings()
    filters = infer_query_metadata_filter(q)
    corpus = await _load_search_corpus(db)
    dense_hits, bm25_hits = await asyncio.gather(
        _dense_recall(q, corpus, settings.rag_dense_top_k),
        asyncio.to_thread(_bm25_recall, q, corpus, settings.rag_bm25_top_k),
    )
    merged = _merge_candidates(dense_hits, bm25_hits)
    if not merged:
        return []
    reranked = await _rerank_candidates(q, merged, filters)
    top = reranked[: settings.rag_top_k]

    out: list[RetrievedSnippet] = []
    for item in top:
        score = item.final_score or item.dense_score or item.bm25_score
        out.append(
            RetrievedSnippet(
                chunk_id=item.chunk.id,
                document_id=item.document.id,
                document_title=item.document.title,
                text=item.chunk.text,
                score=score,
                meta={
                    **item.meta,
                    "retrieval": {
                        "denseScore": round(float(item.dense_score), 4),
                        "bm25Score": round(float(item.bm25_score), 4),
                        "finalScore": round(float(score), 4),
                        "metadataBonusApplied": filters.has_filters(),
                    },
                },
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
