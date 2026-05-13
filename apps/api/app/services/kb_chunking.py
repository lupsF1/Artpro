"""按字符窗口与重叠切分长文本（段落优先）。"""

from __future__ import annotations

import re
from collections.abc import Iterator

from app.config import get_settings


def _normalize_paragraphs(text: str) -> list[str]:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not t:
        return []
    parts = re.split(r"\n\s*\n+", t)
    return [p.strip() for p in parts if p.strip()]


def chunk_text(
    text: str, *, chunk_size: int | None = None, overlap: int | None = None
) -> list[tuple[str, dict]]:
    """返回 (chunk 文本, 元数据)；meta 暂含 part_index。"""
    s = get_settings()
    size = chunk_size if chunk_size is not None else s.kb_chunk_size
    ov = overlap if overlap is not None else s.kb_chunk_overlap
    paras = _normalize_paragraphs(text)
    if not paras:
        return []
    flat = "\n\n".join(paras)
    if len(flat) <= size:
        return [(flat, {"partIndex": 0})]

    chunks: list[tuple[str, dict]] = []
    i = 0
    part = 0
    while i < len(flat):
        end = min(len(flat), i + size)
        # 在窗口内寻找最后一个换行，使切断更自然
        window = flat[i:end]
        if end < len(flat):
            nl = window.rfind("\n\n")
            if nl > size // 4:
                window = window[:nl]
                end = i + nl
        piece = window.strip()
        if piece:
            chunks.append((piece, {"partIndex": part}))
            part += 1
        if end >= len(flat):
            break
        i = max(i + 1, end - ov)
    return chunks


def chunk_text_with_page_bounds(
    page_texts: list[str],
    *,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[tuple[str, dict]]:
    """PDF 按页拼接页号到 meta。"""
    out: list[tuple[str, dict]] = []
    for page_idx, raw in enumerate(page_texts, start=1):
        for text, meta in chunk_text(raw, chunk_size=chunk_size, overlap=overlap):
            m = {**meta, "page": page_idx}
            out.append((text, m))
    return out
