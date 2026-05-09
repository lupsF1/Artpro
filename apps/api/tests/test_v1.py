from __future__ import annotations

import json
import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.errors import E_AI_UNAVAILABLE
from app.main import app

client = TestClient(app)


def test_site_config_envelope() -> None:
    r = client.get("/api/v1/site/config")
    assert r.status_code == 200
    j = r.json()
    assert j["code"] == 0
    assert j["message"] == "ok"
    assert j["data"]["siteName"] == "丝育教育"


def test_articles_list() -> None:
    r = client.get("/api/v1/articles", params={"page": 1, "pageSize": 10})
    assert r.status_code == 200
    j = r.json()
    assert j["code"] == 0
    assert j["data"]["items"] == []
    assert j["data"]["meta"]["page"] == 1
    assert j["data"]["meta"]["pageSize"] == 10
    assert j["data"]["meta"]["total"] == 0


def test_leads_create() -> None:
    r = client.post(
        "/api/v1/leads",
        json={
            "name": "pytest",
            "phone": "13900000000",
            "message": "ok",
        },
    )
    assert r.status_code == 200
    j = r.json()
    assert j["code"] == 0
    d = j["data"]
    assert d["name"] == "pytest"
    assert d["phone"] == "13900000000"
    assert d["message"] == "ok"
    assert d["source"] == "web"
    assert d.get("status") == "new"
    assert "id" in d
    assert "created_at" in d


def test_leads_validation_422() -> None:
    r = client.post("/api/v1/leads", json={"name": "", "phone": "1"})
    assert r.status_code == 422
    j = r.json()
    assert j["code"] != 0
    assert "参数校验失败" in j["message"]


def test_admin_leads_unauthorized() -> None:
    r = client.get("/api/v1/admin/leads")
    assert r.status_code == 401
    j = r.json()
    assert j["code"] == 100401


def test_admin_login_and_leads() -> None:
    r = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    assert r.status_code == 200
    j = r.json()
    assert j["code"] == 0
    token = j["data"]["access_token"]
    r2 = client.get(
        "/api/v1/admin/leads",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r2.status_code == 200
    j2 = r2.json()
    assert j2["code"] == 0
    assert "items" in j2["data"]
    assert "meta" in j2["data"]
    assert j2["data"]["meta"]["page"] == 1


def test_leads_create_then_patch_status() -> None:
    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    lead = client.post(
        "/api/v1/leads",
        json={"name": "p", "phone": "13800138000", "message": "x"},
    ).json()["data"]
    lid = lead["id"]
    p = client.patch(
        f"/api/v1/admin/leads/{lid}",
        json={"status": "contacted"},
        headers=h,
    )
    assert p.status_code == 200
    assert p.json()["data"]["status"] == "contacted"


def test_admin_leads_crud() -> None:
    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    cr = client.post(
        "/api/v1/admin/leads",
        json={
            "name": "后台录入",
            "phone": "13900001111",
            "message": "测试",
            "source": "admin",
            "status": "new",
        },
        headers=h,
    )
    assert cr.status_code == 200
    assert cr.json()["code"] == 0
    lid = cr.json()["data"]["id"]
    g = client.get(f"/api/v1/admin/leads/{lid}", headers=h)
    assert g.status_code == 200
    assert g.json()["data"]["name"] == "后台录入"
    u = client.put(
        f"/api/v1/admin/leads/{lid}",
        json={"name": "已改名", "status": "done"},
        headers=h,
    )
    assert u.status_code == 200
    assert u.json()["data"]["name"] == "已改名"
    assert u.json()["data"]["status"] == "done"
    d = client.delete(f"/api/v1/admin/leads/{lid}", headers=h)
    assert d.status_code == 200
    assert d.json()["code"] == 0
    g404 = client.get(f"/api/v1/admin/leads/{lid}", headers=h)
    assert g404.status_code == 404


def test_admin_article_pipeline_unauthorized() -> None:
    r = client.post(
        "/api/v1/admin/articles/00000000-0000-0000-0000-000000000001/pipeline/outline",
        json={"brief": ""},
    )
    assert r.status_code == 401


def test_admin_article_pipeline_no_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("MIMO_API_KEY", "")
    from app.config import get_settings

    get_settings.cache_clear()

    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    slug = f"pipe-{uuid.uuid4().hex[:12]}"
    cr = client.post(
        "/api/v1/admin/articles",
        json={
            "title": "流水线测试",
            "slug": slug,
            "body": "",
        },
        headers=h,
    )
    assert cr.status_code == 200
    aid = cr.json()["data"]["id"]
    r = client.post(
        f"/api/v1/admin/articles/{aid}/pipeline/outline",
        json={"brief": "考点梳理"},
        headers=h,
    )
    assert r.status_code == 503
    body = r.json()
    assert body["code"] == E_AI_UNAVAILABLE
    assert "OPENAI_API_KEY" in body["message"] or "MIMO_API_KEY" in body["message"]


def test_article_pipeline_creates_revision_without_changing_article(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import get_settings

    async def fake_outline_stream(*args, **kwargs):
        yield "rev-outline-content"

    monkeypatch.setenv("OPENAI_API_KEY", "test-sk")
    monkeypatch.setenv("MIMO_API_KEY", "")
    get_settings.cache_clear()
    monkeypatch.setattr(
        "app.api.v1.admin.stream_outline_deltas",
        fake_outline_stream,
    )

    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    slug = f"rev-{uuid.uuid4().hex[:12]}"
    cr = client.post(
        "/api/v1/admin/articles",
        json={"title": "修订流", "slug": slug, "body": "body-orig"},
        headers=h,
    )
    assert cr.status_code == 200
    aid = cr.json()["data"]["id"]
    before = client.get(f"/api/v1/admin/articles/{aid}", headers=h).json()["data"]
    assert before.get("outline") in (None, "")

    r = client.post(
        f"/api/v1/admin/articles/{aid}/pipeline/outline",
        json={"brief": ""},
        headers=h,
    )
    assert r.status_code == 200
    ct = r.headers.get("content-type") or ""
    assert "text/event-stream" in ct
    raw = r.text or ""
    if not raw and getattr(r, "content", None):
        raw = r.content.decode("utf-8", errors="replace")
    done = None
    for block in raw.split("\n\n"):
        for line in block.split("\n"):
            if line.startswith("data: "):
                obj = json.loads(line[6:])
                if obj.get("type") == "done":
                    done = obj
    assert done is not None
    out = {"revision": done["revision"], "article": done["article"]}
    assert out["revision"]["content"] == "rev-outline-content"
    assert out["revision"]["kind"] == "outline"
    assert out["article"]["outline"] == before.get("outline")
    assert out["article"]["body"] == "body-orig"

    lst = client.get(
        f"/api/v1/admin/articles/{aid}/revisions?kind=outline",
        headers=h,
    )
    assert lst.status_code == 200
    items = lst.json()["data"]["items"]
    assert len(items) == 1
    rid = items[0]["id"]

    ap = client.post(
        f"/api/v1/admin/articles/{aid}/revisions/{rid}/apply",
        headers=h,
    )
    assert ap.status_code == 200
    art = ap.json()["data"]
    assert art["outline"] == "rev-outline-content"
    assert art["pipeline_stage"] == "outlined"


def test_article_revisions_bad_kind() -> None:
    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    slug = f"bk-{uuid.uuid4().hex[:12]}"
    aid = client.post(
        "/api/v1/admin/articles",
        json={"title": "t", "slug": slug, "body": ""},
        headers=h,
    ).json()["data"]["id"]
    r = client.get(
        f"/api/v1/admin/articles/{aid}/revisions?kind=invalid",
        headers=h,
    )
    assert r.status_code == 422


def test_outline_normalize_demotes_extra_h2() -> None:
    from app.services.article_pipeline import _normalize_outline_markdown

    raw = "## A\n### x\n## B\n### y\n"
    out = _normalize_outline_markdown(raw)
    assert out.splitlines()[0].lstrip().startswith("## ")
    assert "### B" in out
    assert "\n## B" not in out


def _markdown_h2_heading_lines(md: str) -> list[str]:
    """ATX headings that are exactly ## (not ###+)."""
    import re

    out: list[str] = []
    for ln in md.splitlines():
        m = re.match(r"^(#{2})(?!#)\s*(.*)$", ln.lstrip())
        if m:
            out.append(ln.strip())
    return out


def test_article_pipeline_outline_sse_normalizes_extra_h2(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import get_settings

    async def fake_stream(*args, **kwargs):
        yield "## 总标题\n### 第一节\n## 第二节误用h2\n### 小节\n"

    monkeypatch.setenv("OPENAI_API_KEY", "test-sk")
    monkeypatch.setenv("MIMO_API_KEY", "")
    get_settings.cache_clear()
    monkeypatch.setattr(
        "app.api.v1.admin.stream_outline_deltas",
        fake_stream,
    )

    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    slug = f"norm-{uuid.uuid4().hex[:12]}"
    cr = client.post(
        "/api/v1/admin/articles",
        json={"title": "规范化测试", "slug": slug, "body": ""},
        headers=h,
    )
    aid = cr.json()["data"]["id"]

    r = client.post(
        f"/api/v1/admin/articles/{aid}/pipeline/outline",
        json={"brief": ""},
        headers=h,
    )
    assert r.status_code == 200
    raw = r.text or ""
    if not raw and getattr(r, "content", None):
        raw = r.content.decode("utf-8", errors="replace")
    done = None
    for block in raw.split("\n\n"):
        for line in block.split("\n"):
            if line.startswith("data: "):
                obj = json.loads(line[6:])
                if obj.get("type") == "done":
                    done = obj
    assert done is not None
    content = done["revision"]["content"]
    h2_lines = _markdown_h2_heading_lines(content)
    assert len(h2_lines) == 1, h2_lines
    assert "### 第二节误用h2" in content


def test_delete_article_revision(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import get_settings

    async def fake_stream(*args, **kwargs):
        yield "rev-to-delete"

    monkeypatch.setenv("OPENAI_API_KEY", "test-sk")
    monkeypatch.setenv("MIMO_API_KEY", "")
    get_settings.cache_clear()
    monkeypatch.setattr(
        "app.api.v1.admin.stream_outline_deltas",
        fake_stream,
    )

    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    slug = f"delrev-{uuid.uuid4().hex[:12]}"
    cr = client.post(
        "/api/v1/admin/articles",
        json={"title": "删修订", "slug": slug, "body": ""},
        headers=h,
    )
    aid = cr.json()["data"]["id"]
    r = client.post(
        f"/api/v1/admin/articles/{aid}/pipeline/outline",
        json={"brief": ""},
        headers=h,
    )
    assert r.status_code == 200
    rid = None
    raw = r.text or ""
    if not raw and getattr(r, "content", None):
        raw = r.content.decode("utf-8", errors="replace")
    for block in raw.split("\n\n"):
        for line in block.split("\n"):
            if line.startswith("data: "):
                obj = json.loads(line[6:])
                if obj.get("type") == "done":
                    rid = obj["revision"]["id"]
    assert rid is not None
    d = client.delete(
        f"/api/v1/admin/articles/{aid}/revisions/{rid}",
        headers=h,
    )
    assert d.status_code == 200
    assert d.json()["code"] == 0
    lst = client.get(
        f"/api/v1/admin/articles/{aid}/revisions?kind=outline",
        headers=h,
    )
    assert lst.status_code == 200
    assert lst.json()["data"]["items"] == []


def test_article_revision_purge_expired(monkeypatch: pytest.MonkeyPatch) -> None:
    import asyncio
    from datetime import datetime, timedelta, timezone

    from app.config import get_settings
    from app.db import AsyncSessionLocal
    from app.models.article_revision import ArticleRevision
    from app.services.article_revision_cleanup import purge_expired_article_revisions

    monkeypatch.setenv("ARTICLE_REVISION_RETENTION_HOURS", "1")
    get_settings.cache_clear()

    c = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "testpass123"},
    )
    token = c.json()["data"]["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    slug = f"purge-{uuid.uuid4().hex[:12]}"
    cr = client.post(
        "/api/v1/admin/articles",
        json={"title": "清理测试", "slug": slug, "body": ""},
        headers=h,
    )
    aid = uuid.UUID(str(cr.json()["data"]["id"]))

    async def seed() -> None:
        async with AsyncSessionLocal() as s:
            s.add(
                ArticleRevision(
                    article_id=aid,
                    kind="outline",
                    content="old-rev",
                    source="ai",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=3),
                )
            )
            s.add(
                ArticleRevision(
                    article_id=aid,
                    kind="outline",
                    content="new-rev",
                    source="ai",
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=30),
                )
            )
            await s.commit()

    asyncio.run(seed())
    removed = asyncio.run(purge_expired_article_revisions())
    assert removed >= 1

    lst = client.get(
        f"/api/v1/admin/articles/{aid}/revisions?kind=outline",
        headers=h,
    )
    assert lst.status_code == 200
    items = lst.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["content"] == "new-rev"
