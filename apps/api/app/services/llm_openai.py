"""OpenAI 兼容 Chat Completions（文章流水线）。"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.config import get_settings


class LLMUnavailableError(Exception):
    """未配置 API Key 等，本地无法调用。"""


class LLMUpstreamError(Exception):
    """上游返回错误或超时。"""


def _extract_stream_chunk_text(data: dict) -> str | None:
    """从 OpenAI 兼容的 chat.completion.chunk 取出可见文本增量（多网关字段略有差异）。"""
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        delta = (choices[0] or {}).get("delta") or {}
        if not isinstance(delta, dict):
            delta = {}
        piece = delta.get("content")
        if isinstance(piece, str) and piece:
            return piece
        # 部分网关/模型返回分片列表
        if isinstance(piece, list):
            acc: list[str] = []
            for item in piece:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        t = item.get("text")
                        if isinstance(t, str):
                            acc.append(t)
                    elif "text" in item and isinstance(item["text"], str):
                        acc.append(item["text"])
                elif isinstance(item, str):
                    acc.append(item)
            if acc:
                return "".join(acc)
    # 少数兼容实现把 delta 放在根上（无 choices）
    root_delta = data.get("delta")
    if isinstance(root_delta, dict):
        piece = root_delta.get("content")
        if isinstance(piece, str) and piece:
            return piece
    return None


async def chat_completion(
    *, system: str, user: str, temperature: float = 0.7
) -> str:
    s = get_settings()
    key = s.resolved_llm_api_key()
    if not key:
        raise LLMUnavailableError()
    url = f"{s.openai_base_url.rstrip('/')}/chat/completions"
    model = (s.openai_model or "xiaomi/mimo-v2-flash").strip()
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
    }
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as e:
        raise LLMUpstreamError(str(e)) from e
    if r.status_code >= 400:
        raise LLMUpstreamError(r.text[:500] if r.text else r.reason_phrase)
    try:
        data = r.json()
        choice = data["choices"][0]
        content = choice["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise LLMUpstreamError("模型响应格式异常") from e
    if not isinstance(content, str):
        raise LLMUpstreamError("模型响应非文本")
    return content.strip()


async def chat_completion_stream(
    *, system: str, user: str, temperature: float = 0.7
) -> AsyncIterator[str]:
    """流式输出：按上游 SSE 分包 yield 文本增量。"""
    s = get_settings()
    key = s.resolved_llm_api_key()
    if not key:
        raise LLMUnavailableError()
    url = f"{s.openai_base_url.rstrip('/')}/chat/completions"
    model = (s.openai_model or "xiaomi/mimo-v2-flash").strip()
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST", url, json=payload, headers=headers
            ) as response:
                if response.status_code >= 400:
                    body = (await response.aread()).decode(errors="replace")
                    raise LLMUpstreamError(
                        body[:500] if body else response.reason_phrase
                    )
                async for line in response.aiter_lines():
                    if not line or line.startswith(":"):
                        continue
                    raw_payload: str | None = None
                    if line.startswith("data:"):
                        raw_payload = line[5:].strip()
                    if raw_payload is None:
                        continue
                    if raw_payload == "[DONE]":
                        break
                    try:
                        data = json.loads(raw_payload)
                    except json.JSONDecodeError:
                        continue
                    piece = _extract_stream_chunk_text(data)
                    if piece:
                        yield piece
    except LLMUnavailableError:
        raise
    except LLMUpstreamError:
        raise
    except httpx.HTTPError as e:
        raise LLMUpstreamError(str(e)) from e


def _validate_chat_messages(messages: list[dict[str, str]]) -> None:
    if not messages:
        raise ValueError("empty messages")
    roles = {"system", "user", "assistant"}
    for m in messages:
        if not isinstance(m, dict) or m.get("role") not in roles:
            raise ValueError("invalid message role")
        c = m.get("content")
        if not isinstance(c, str) or not c.strip():
            raise ValueError("empty content")


async def chat_completion_stream_messages(
    *,
    messages: list[dict[str, str]],
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """流式多轮对话：messages 须含 role/content；首条建议为 system。"""
    _validate_chat_messages(messages)
    s = get_settings()
    key = s.resolved_llm_api_key()
    if not key:
        raise LLMUnavailableError()
    url = f"{s.openai_base_url.rstrip('/')}/chat/completions"
    model = (s.openai_model or "xiaomi/mimo-v2-flash").strip()
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST", url, json=payload, headers=headers
            ) as response:
                if response.status_code >= 400:
                    body = (await response.aread()).decode(errors="replace")
                    raise LLMUpstreamError(
                        body[:500] if body else response.reason_phrase
                    )
                async for line in response.aiter_lines():
                    if not line or line.startswith(":"):
                        continue
                    raw_payload: str | None = None
                    if line.startswith("data:"):
                        raw_payload = line[5:].strip()
                    if raw_payload is None:
                        continue
                    if raw_payload == "[DONE]":
                        break
                    try:
                        data = json.loads(raw_payload)
                    except json.JSONDecodeError:
                        continue
                    piece = _extract_stream_chunk_text(data)
                    if piece:
                        yield piece
    except LLMUnavailableError:
        raise
    except LLMUpstreamError:
        raise
    except httpx.HTTPError as e:
        raise LLMUpstreamError(str(e)) from e
