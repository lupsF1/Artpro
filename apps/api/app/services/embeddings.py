"""OpenAI 兼容 Embeddings API。"""

from __future__ import annotations

import math
from typing import Any, Literal

import httpx

from app.config import get_settings


class EmbeddingUnavailableError(Exception):
    """未配置 Key 或 base URL。"""


class EmbeddingUpstreamError(Exception):
    """上游错误。"""


async def embed_texts(
    texts: list[str],
    *,
    task: Literal["query", "document"] = "document",
) -> list[list[float]]:
    if not texts:
        return []
    s = get_settings()
    key = s.resolved_embedding_api_key()
    base = s.resolved_embedding_base_url()
    if not key or not base:
        raise EmbeddingUnavailableError()
    url = f"{base}/embeddings"
    model = (s.embedding_model or "text-embedding-3-small").strip()
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "X-Embedding-Task": task,
    }
    payload: dict[str, Any] = {
        "model": model,
        "input": texts,
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as e:
        raise EmbeddingUpstreamError(str(e)) from e
    if r.status_code >= 400:
        raise EmbeddingUpstreamError(r.text[:500] if r.text else r.reason_phrase)
    try:
        data = r.json()
    except Exception as e:
        raise EmbeddingUpstreamError("embeddings 响应非 JSON") from e
    items = data.get("data")
    if not isinstance(items, list) or len(items) != len(texts):
        raise EmbeddingUpstreamError("embeddings 返回条数与输入不一致")
    indexed: list[tuple[int, list[float]]] = []
    for item in items:
        if not isinstance(item, dict):
            raise EmbeddingUpstreamError("embeddings data 项格式异常")
        idx = item.get("index")
        if not isinstance(idx, int):
            idx = len(indexed)
        emb = item.get("embedding")
        if not isinstance(emb, list):
            raise EmbeddingUpstreamError("embedding 字段缺失或类型错误")
        vec = [float(x) for x in emb]
        if not vec:
            raise EmbeddingUpstreamError("空向量")
        indexed.append((idx, vec))
    indexed.sort(key=lambda x: x[0])
    out = [v for _, v in indexed]
    if len(out) != len(texts):
        raise EmbeddingUpstreamError("embeddings 索引不完整")
    return out


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)
