from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_site_config_envelope() -> None:
    r = client.get("/api/v1/site/config")
    assert r.status_code == 200
    j = r.json()
    assert j["code"] == 0
    assert j["message"] == "ok"
    assert j["data"]["siteName"] == "ArtPro 艺考"


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
    assert "id" in d
    assert "created_at" in d


def test_leads_validation_422() -> None:
    r = client.post("/api/v1/leads", json={"name": "", "phone": "1"})
    assert r.status_code == 422
    j = r.json()
    assert j["code"] != 0
    assert "参数校验失败" in j["message"]
