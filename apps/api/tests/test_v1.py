from __future__ import annotations

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
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
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
    assert "OPENAI_API_KEY" in body["message"]
