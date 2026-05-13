"""艺考咨询助手：拼装 RAG system 与多轮 messages。"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.kb_retrieval import (
    RetrievedSnippet,
    retrieve_snippets,
    snippets_to_prompt_block,
)
from app.services.site_config import get_or_create_row


def snippets_to_citations(snippets: list[RetrievedSnippet]) -> list[dict]:
    out: list[dict] = []
    for s in snippets:
        out.append(
            {
                "chunkId": str(s.chunk_id),
                "documentId": str(s.document_id),
                "documentTitle": s.document_title,
                "score": round(float(s.score), 4),
                "preview": (s.text[:200] + "…") if len(s.text) > 200 else s.text,
                "meta": s.meta,
            }
        )
    return out


def _last_user_text(messages: list[dict[str, str]]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user":
            c = m.get("content")
            if isinstance(c, str) and c.strip():
                return c.strip()
    return ""


async def build_consult_messages(
    db: AsyncSession,
    *,
    history: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[RetrievedSnippet]]:
    """history 仅为 user/assistant 交替（不含 system）。返回完整 messages（含 system）与引用摘录。"""
    row = await get_or_create_row(db)
    site_name = row.site_name or "丝育教育"
    phone = (row.phone or "").strip() or "（见官网联系方式）"
    query = _last_user_text(history)
    snippets = await retrieve_snippets(db, query)
    kb_block = snippets_to_prompt_block(snippets)

    system = f"""你是「{site_name}」官网的艺考咨询助手（美术/传媒艺考方向）。回答必须严格基于下方「知识库摘录」与机构公开信息。
- 若摘录为空或不足以具体回答，请明确说明未在知识库中找到相关内容，并建议用户通过官网「预约咨询」或联系电话 {phone} 联系老师；勿臆测。
- 禁止编造具体分数线、录取率、保过、内部指标等政策类信息。
- 语气专业、亲切，使用简体中文。

【知识库摘录】
{kb_block}

【机构公开信息】站点名：{site_name}；电话：{phone}。"""

    out: list[dict[str, str]] = [{"role": "system", "content": system}]
    for m in history:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            out.append({"role": role, "content": content})
    return out, snippets
