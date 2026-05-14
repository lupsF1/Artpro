"""按字符窗口与重叠切分长文本（段落优先）。"""

from __future__ import annotations

import re
from typing import Any

from app.config import get_settings


def _normalize_paragraphs(text: str) -> list[str]:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not t:
        return []
    parts = re.split(r"\n\s*\n+", t)
    return [p.strip() for p in parts if p.strip()]


def _coalesce_short_paragraphs(paras: list[str], *, chunk_size: int) -> list[str]:
    """Merge short extracted lines into context-sized paragraphs."""
    if len(paras) <= 1:
        return paras
    target = max(180, min(chunk_size, 450))
    merged: list[str] = []
    current: list[str] = []
    current_len = 0
    for para in paras:
        para_len = len(para)
        if para_len >= target:
            if current:
                merged.append("\n".join(current))
                current = []
                current_len = 0
            merged.append(para)
            continue
        next_len = current_len + para_len + (1 if current else 0)
        if current and next_len > target:
            merged.append("\n".join(current))
            current = [para]
            current_len = para_len
        else:
            current.append(para)
            current_len = next_len
    if current:
        merged.append("\n".join(current))
    return merged


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
    paras = _coalesce_short_paragraphs(paras, chunk_size=size)
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


def _flush_structured_group(
    group: list[tuple[str, dict[str, Any], int]],
    out: list[tuple[str, dict]],
    *,
    chunk_size: int,
    overlap: int,
) -> None:
    if not group:
        return
    text = "\n".join(item[0] for item in group).strip()
    if not text:
        return
    first_meta = dict(group[0][1])
    block_types = [str(meta.get("blockType") or "") for _, meta, _ in group]
    meta: dict[str, Any] = {
        **first_meta,
        "blockType": block_types[0] if len(group) == 1 else "group",
        "blockTypes": sorted({t for t in block_types if t}),
        "blockIndexStart": group[0][2],
        "blockIndexEnd": group[-1][2],
    }
    if len(text) <= chunk_size:
        out.append((text, {**meta, "partIndex": 0}))
        return
    for piece, piece_meta in chunk_text(text, chunk_size=chunk_size, overlap=overlap):
        out.append((piece, {**meta, **piece_meta}))


def chunk_structured_blocks(
    blocks: list[dict[str, Any]],
    *,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[tuple[str, dict]]:
    """Chunk structured DOCX blocks, merging adjacent short paragraphs/lists."""
    s = get_settings()
    size = chunk_size if chunk_size is not None else s.kb_chunk_size
    ov = overlap if overlap is not None else s.kb_chunk_overlap
    target = max(180, min(size, 450))
    out: list[tuple[str, dict]] = []
    group: list[tuple[str, dict[str, Any], int]] = []
    group_len = 0

    def flush() -> None:
        nonlocal group, group_len
        _flush_structured_group(group, out, chunk_size=size, overlap=ov)
        group = []
        group_len = 0

    for block_index, block in enumerate(blocks):
        text = str(block.get("text") or "").strip()
        if not text:
            continue
        meta = dict(block.get("meta") or {})
        meta.setdefault("blockIndex", block_index)
        block_type = str(meta.get("blockType") or "paragraph")

        # Keep tables and styled headings structurally visible. Unstyled Word
        # exports often use plain paragraphs for outline lines, so those are
        # merged below to avoid tiny semantic fragments.
        if block_type in {"table", "heading"}:
            flush()
            _flush_structured_group([(text, meta, block_index)], out, chunk_size=size, overlap=ov)
            continue

        if len(text) > size:
            flush()
            _flush_structured_group([(text, meta, block_index)], out, chunk_size=size, overlap=ov)
            continue

        next_len = group_len + len(text) + (1 if group else 0)
        if group and next_len > target:
            flush()
        group.append((text, meta, block_index))
        group_len = len(text) if group_len == 0 else group_len + len(text) + 1

    flush()
    return out


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
