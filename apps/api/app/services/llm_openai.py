"""OpenAI 兼容 Chat Completions（文章流水线）。"""

from __future__ import annotations

import httpx

from app.config import get_settings


class LLMUnavailableError(Exception):
    """未配置 API Key 等，本地无法调用。"""


class LLMUpstreamError(Exception):
    """上游返回错误或超时。"""


async def chat_completion(*, system: str, user: str) -> str:
    s = get_settings()
    key = (s.openai_api_key or "").strip()
    if not key:
        raise LLMUnavailableError()
    url = f"{s.openai_base_url.rstrip('/')}/chat/completions"
    model = (s.openai_model or "gpt-4o-mini").strip()
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.7,
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
