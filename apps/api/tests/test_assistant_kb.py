"""艺考咨询助手与知识库 API 测试。"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.errors import E_AI_UNAVAILABLE
from app.main import app

client = TestClient(app)


def test_kb_documents_unauthorized() -> None:
    r = client.get("/api/v1/admin/kb/documents")
    assert r.status_code == 401


def test_assistant_chat_no_llm_key(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import get_settings

    s = get_settings()
    monkeypatch.setattr(s, "openai_api_key", "")
    monkeypatch.setattr(s, "mimo_api_key", "")
    r = client.post(
        "/api/v1/assistant/chat",
        json={"messages": [{"role": "user", "content": "你好"}]},
    )
    assert r.status_code == 503
    j = r.json()
    assert j["code"] == E_AI_UNAVAILABLE


def test_assistant_chat_last_must_be_user() -> None:
    r = client.post(
        "/api/v1/assistant/chat",
        json={
            "messages": [
                {"role": "user", "content": "a"},
                {"role": "assistant", "content": "b"},
            ]
        },
    )
    assert r.status_code == 422
