"""公开：艺考咨询助手（SSE）。"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse, StreamingResponse

from app.config import settings
from app.core.errors import E_AI_UNAVAILABLE, E_INTERNAL
from app.core.responses import err
from app.db import AsyncSessionLocal
from app.limiter import limiter
from app.schemas.assistant_chat import AssistantChatIn
from app.services.consult_assistant import build_consult_messages, snippets_to_citations
from app.services.embeddings import EmbeddingUnavailableError, EmbeddingUpstreamError
from app.services.llm_openai import (
    LLMUnavailableError,
    LLMUpstreamError,
    chat_completion_stream_messages,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["assistant"])

_STREAM_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


def _sse_line(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


@router.post("/assistant/chat", response_model=None)
@limiter.limit(settings.assistant_rate_limit)
async def assistant_chat(request: Request, data: AssistantChatIn) -> StreamingResponse:
    if not settings.resolved_llm_api_key():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=err(
                E_AI_UNAVAILABLE,
                "未配置对话模型：请设置 OPENAI_API_KEY 或 MIMO_API_KEY",
            ),
        )
    if not settings.resolved_embedding_api_key() or not settings.resolved_embedding_base_url():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=err(
                E_AI_UNAVAILABLE,
                "未配置向量模型：请设置 Embeddings 可用的 Key 与 EMBEDDING_BASE_URL（或 OPENAI_BASE_URL）",
            ),
        )

    history = [
        {"role": m.role, "content": m.content.strip()} for m in data.messages
    ]

    async def events():
        async with AsyncSessionLocal() as db:
            try:
                llm_messages, snippets = await build_consult_messages(
                    db, history=history
                )
            except EmbeddingUnavailableError:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_AI_UNAVAILABLE,
                        "message": "向量服务不可用：请配置 EMBEDDING_API_KEY 与 EMBEDDING_BASE_URL",
                    }
                )
                return
            except EmbeddingUpstreamError as e:
                logger.exception("assistant_embedding")
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"向量服务异常：{e}",
                    }
                )
                return
            except Exception as e:
                logger.exception("assistant_build_messages")
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"准备回答失败：{e}",
                    }
                )
                return

            cites = snippets_to_citations(snippets)
            try:
                async for delta in chat_completion_stream_messages(
                    messages=llm_messages,
                    temperature=0.45,
                ):
                    yield _sse_line({"type": "delta", "text": delta})
                yield _sse_line({"type": "done", "citations": cites})
            except LLMUnavailableError:
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_AI_UNAVAILABLE,
                        "message": "未配置对话模型",
                    }
                )
            except LLMUpstreamError as e:
                logger.exception("assistant_llm")
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"模型服务异常：{e}",
                    }
                )
            except Exception as e:
                logger.exception("assistant_stream")
                yield _sse_line(
                    {
                        "type": "error",
                        "code": E_INTERNAL,
                        "message": f"生成失败：{e}",
                    }
                )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers=dict(_STREAM_HEADERS),
    )

