# 丝育教育官网（ArtPro 仓库）

本仓库为 **丝育教育** 艺考类培训官网的 **monorepo**：Python **FastAPI** 提供 `/api/v1` JSON API，**Next.js 15**（App Router + React 19）提供官网前端。技术原则与分阶段见 [docs/艺考官网-开发方案.md](docs/艺考官网-开发方案.md)；产品与接口总览见 [docs/艺考官网-需求说明.md](docs/艺考官网-需求说明.md)。

| 子项目 | 技术栈 | 说明 |
|--------|--------|------|
| [apps/api](apps/api) | Python 3.12+、FastAPI、Pydantic v2、SQLAlchemy 2（async）、Alembic | 默认 **SQLite**（`data/artpro.db`），可切换 **PostgreSQL**（`DATABASE_URL`） |
| [apps/web](apps/web) | Next.js **15.5.x**、TypeScript、Tailwind CSS、Vitest | 多页路由（见下），首屏/元数据为服务端拉取，留资为客户端 `fetch` |

**官网页面**（`app/(site)/`）：`/` 首页主视觉；`/teaching` 教学特色；`/news` 资讯列表；`/news/[slug]` 单篇资讯（Markdown 渲染）；`/contact` 预约咨询。顶栏 `Link` 切换，不再使用单页锚点滚到底。

**管理端**（`app/(admin)/admin/`）：`/admin/login` JWT 登录；侧栏 **预约信息**（`/admin/leads` 列表、快捷改状态、行内删除；`/admin/leads/new` 新建；`/admin/leads/[id]` 编辑/删除）、**站点**（`/admin/site`）、**文章管理**（`/admin/articles` 列表含行内删除；`/admin/articles/new`；`/admin/articles/[id]` 编辑/删除）。Token 存浏览器 `localStorage`，请求带 `Authorization: Bearer`。

## 环境

- **Node.js** 20+（建议 ≥20.18，与 `apps/web/package.json` 的 `engines` 一致）
- **Python** 3.12+（在仓库根或 `apps/api` 下使用虚拟环境即可）
- 可选：**Docker** 起本机 PostgreSQL（[docker-compose.yml](docker-compose.yml)）

## 快速启动

### 1) API（`apps/api`）

```bash
cd apps/api
source ../../.venv/bin/activate   # 或自建 venv
pip install -r requirements.txt  # 首次
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **OpenAPI 文档**：http://127.0.0.1:8000/docs（应用标题为「丝育教育 API」）  
- **存活**：`GET /health/live`  
- **就绪**（连库）：`GET /health/ready`  

`DATABASE_URL` / `DATABASE_URL_SYNC`、`CORS_ORIGINS`、**管理端** `ADMIN_JWT_SECRET` / `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` 等见根目录 [`.env.example`](.env.example)。`apps/api` 启动时会从**仓库根** [`/.env`](.env) 读取（见 `apps/api/app/config.py` 中 `_env_file_paths`）。

#### 使用 PostgreSQL（本地 Docker，全新库）

与 [docker-compose.yml](docker-compose.yml) 中 `db` 服务一致：用户/库/密码均为 `artpro`，端口 `5432`。

**WSL/Ubuntu 若尚未安装 Docker**（终端执行一次，会提示 sudo 密码）：

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
# 关闭并重新打开 WSL，或执行: newgrp docker
docker run --rm hello-world
```

装好后可在仓库根**一键起库并迁移**：`./scripts/postgres-docker-migrate.sh`（依赖根目录 `.env` 已配置下方 `DATABASE_*`）。

1. 仓库根目录启动数据库：`docker compose up -d`（或 `docker compose up -d db`）；若已用上一键脚本可跳过本步与第 3 步中的 `alembic`。
2. 在仓库根创建或编辑 `.env`，至少包含（`127.0.0.1` 可避免部分环境下 `localhost` 走 IPv6 连不上映射端口的问题）：

   ```env
   DATABASE_URL=postgresql+asyncpg://artpro:artpro@127.0.0.1:5432/artpro
   DATABASE_URL_SYNC=postgresql+psycopg://artpro:artpro@127.0.0.1:5432/artpro
   ```

3. 在 `apps/api` 下执行 `alembic upgrade head`，再按上文启动 `uvicorn`。
4. 确认 `GET /health/ready` 返回 `200` 且 `database` 为 `connected`。

未配置上述变量时，API 仍默认使用 SQLite（`apps/api/data/artpro.db`），便于无 Docker 时开发。

### 2) 前端（`apps/web`）

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

浏览器：http://localhost:3000  

`NEXT_PUBLIC_API_URL` 需指向 API 基址（默认 `http://127.0.0.1:8000`）；后端 CORS 已包含 `http://localhost:3000` 与 `http://127.0.0.1:3000`。

生产：在 `apps/web` 执行 `npm run build` 后 `npm run start`。

## 已实现接口与前端对关系（与代码一致）

### 公开 `/api/v1`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/site/config` | `siteName`、`phone`、`address`、`icp`；数据来自 `site_config` 表（首访自动建默认行） |
| `GET` | `/api/v1/articles` | 已发布文章分页；`page`、`pageSize`；`items` 含 `id`、`title`、`slug`、`excerpt`、`publishedAt` |
| `GET` | `/api/v1/articles/{slug}` | 单篇已发布正文（含 `body` Markdown 源），用于官网资讯详情 |
| `POST` | `/api/v1/leads` | 留资；`LeadCreate`，写入 `leads`（含 `status` 默认 `new`） |
| `GET` | `/health/live`、`/health/ready` | 健康检查 |

### 认证与管理（需 `Authorization: Bearer`，除登录外）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/auth/login` |  body `username` / `password`，返回 JWT；依赖环境变量中 bcrypt 与 `ADMIN_JWT_SECRET` |
| `GET` | `/api/v1/admin/leads` | 预约信息列表分页，排序 `created_at desc` |
| `POST` | `/api/v1/admin/leads` | 新建预约信息（管理端录入） |
| `GET` | `/api/v1/admin/leads/{id}` | 单条预约详情 |
| `PUT` | `/api/v1/admin/leads/{id}` | 更新预约字段（至少传一个要改的字段） |
| `PATCH` | `/api/v1/admin/leads/{id}` | 更新 `status`（快捷改状态） |
| `DELETE` | `/api/v1/admin/leads/{id}` | 删除预约信息 |
| `PUT` | `/api/v1/admin/site/config` | 更新站点配置（与公开 GET 字段一致） |
| `GET` | `/api/v1/admin/articles` | 文章列表（含草稿） |
| `POST` | `/api/v1/admin/articles` | 创建文章 |
| `GET` | `/api/v1/admin/articles/{id}` | 单篇详情 |
| `PUT` | `/api/v1/admin/articles/{id}` | 更新 |
| `DELETE` | `/api/v1/admin/articles/{id}` | 删除 |

PRD 中其它路径（`banners`、`teachers`、`events` 等）**尚未实现**，仍以 PRD 为预留设计。

**前端**（`apps/web`）主要对应关系：

- `app/layout.tsx`：根布局、`AppProviders`（全局 Toast）、`generateMetadata`（`fetchSiteConfig`）  
- `app/(site)/layout.tsx`：站壳（顶栏/页脚拉取 `site/config`）  
- `app/(site)/page.tsx`：首页；`news/page.tsx` + `news/[slug]/page.tsx` 拉取 `articles` / 按 slug 取详情；`contact/page.tsx` 含 `LeadForm`  
- `app/(admin)/admin/*`：管理端页面（预约信息 / 文章管理 CRUD 见上）；`lib/adminApi.ts`（`adminLogin`、`adminFetch`）  
- `lib/api-server.ts`：`import "server-only"` + `cache()`；`fetchArticleBySlug` 等  
- `components/ArticleMarkdown.tsx`：资讯正文 Markdown 安全渲染（`remark-gfm` + `rehype-sanitize`）  
- `components/LeadForm.tsx`：客户端 `POST` `/api/v1/leads`（`getApiBase()`）

## 测试

**后端**（在 `apps/api` 下，需已安装依赖）：

```bash
cd apps/api
source ../../.venv/bin/activate
pytest -q
```

**前端**：

```bash
cd apps/web
npm run lint
npm run test
npm run build
```

## 目录（摘要）

| 路径 | 说明 |
|------|------|
| [docs/](docs/) | PRD、开发方案（产品/架构） |
| [apps/api/app/](apps/api/app/) | FastAPI 入口、[`api/v1/`](apps/api/app/api/v1/)、`core/` 统一响应、[`models/`](apps/api/app/models/)、`schemas/`、Alembic 迁移在 [`alembic/`](apps/api/alembic/) |
| [apps/web/app/](apps/web/app/) | Next `app/` 路由、全局样式 |
| [apps/web/components/](apps/web/components/) | 页头/页脚/留资/导航/线条与**版式装饰层**（`ArtAtmosphere`，按页 `variant`）等 |
| [apps/web/lib/](apps/web/lib/) | `api.ts`、`api-server.ts`、`parseJsonEnvelope.ts`、`site-nav.ts`、`site-content.ts` |

根目录 **无** 独立 `openapi/` 子目录时，以运行中服务的 `/openapi.json` 与 [docs/艺考官网-需求说明.md](docs/艺考官网-需求说明.md) §6 为合同参考；若后续增加 Spectral/CI 校验，可再建 `openapi/` 并写回此处说明。

## 品牌与数据默认

- 品牌展示名 **丝育教育**：前后端未接库时的默认名见 `apps/web/app/(site)/page.tsx`（`siteName` 初值）、`apps/api/app/api/v1/site.py`（`siteName` 字段）及 `apps/web/app/layout.tsx` 中 `generateMetadata` 的缺省 `title`。
- 代码仓库与配置中的仍可使用 **ArtPro** 作为仓库/资源名（如 `artpro.db`、数据库用户 `artpro`），与对外品牌可并存。

---

方案选型背景：见 [docs/艺考官网-开发方案.md](docs/艺考官网-开发方案.md) 第 3 节「方案 B（Python API + 前端）」；当前实现即 **方案 B**。
