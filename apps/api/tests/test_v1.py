from fastapi.testclient import TestClient

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
