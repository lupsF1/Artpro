# ArtPro 艺考公司官网

方案 B（见 [docs/艺考官网-开发方案.md](docs/艺考官网-开发方案.md)）：

- `apps/api`：FastAPI，`/api/v1` + SQLite（本机开发默认）/ PostgreSQL（生产）
- `apps/web`：Next.js 15 官网

## 环境

- Node.js 20+
- Python 3.12+（已含项目根目录 `.venv` 时可复用）
- 可选：Docker，用于本机起 PostgreSQL（[docker-compose.yml](docker-compose.yml)）

## 快速启动

### 1) API

```bash
cd apps/api
# 自项目根目录激活 venv
source ../../.venv/bin/activate
pip install -r requirements.txt   # 首次
# 迁移（SQLite 会创建 data/artpro.db）
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- 文档：http://127.0.0.1:8000/docs  
- 健康检查：http://127.0.0.1:8000/health/live  

**PostgreSQL**：设置环境变量 `DATABASE_URL` / `DATABASE_URL_SYNC` 指向 Postgres（见根目录 [`.env.example`](.env.example)），`docker compose up -d` 后再执行 `alembic upgrade head`。

### 2) 前端

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

浏览器：http://localhost:3000（需 API 在 `NEXT_PUBLIC_API_URL`，默认 8000 端口且 CORS 已放行 3000）

生产构建：在仓库内执行 `cd apps/web && npm run build`。若个别 WSL/容器环境对 `next build` 出现 `Bus error`，可在本机或 CI（Node 20.19+）上构建；`Next.js` 已锁定至含安全修复的 `15.5.7`（见官方安全公告，可按 `npm outdated` 继续升级小版本）。

## 测试

**后端**（独立测试库 `data/pytest.db`，需在 `apps/api` 下执行）：

```bash
cd apps/api
source ../../.venv/bin/activate   # 若使用根目录 venv
pip install -r requirements.txt
pytest -q
```

**前端**（静态检查 + 单元测试 + 生产构建）：

```bash
cd apps/web
npm run lint
npm run test
npm run build
```

## 目录

| 路径 | 说明 |
|------|------|
| [docs/](docs/) | 需求与开发方案 |
| [apps/api/](apps/api/) | FastAPI 应用、Alembic |
| [apps/web/](apps/web/) | Next.js 应用 |
