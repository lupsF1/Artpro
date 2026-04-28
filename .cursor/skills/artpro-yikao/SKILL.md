---
name: artpro-yikao
description: >-
  Develops and extends the 丝育教育/ArtPro 官网 monorepo (FastAPI + Next.js) per
  project docs: REST /api/v1 envelope, apps/api and apps/web layout, SQLite/Postgres,
  Alembic, and PRD-reserved routes. Use when editing ArtPro, 艺考官网, apps/api,
  apps/web, leads/site/articles, or when the user asks about this repository stack.
---

# 丝育教育官网 / ArtPro 仓库（技能）

## 仓库是什么

- **后端**：[`apps/api`](apps/api) — FastAPI，前缀 **`/api/v1`**，默认 SQLite（`apps/api/data/artpro.db`），迁移用 **Alembic**（在 `apps/api` 下执行 `alembic upgrade head`）。
- **前端**：[`apps/web`](apps/web) — Next.js（App Router），通过 **`NEXT_PUBLIC_API_URL`** 指向后端（常见 `http://127.0.0.1:8000`）。
- **管理端 UI**：侧栏 **预约信息**（`/admin/leads*` 全量 CRUD + 快捷改状态）、**文章管理**（`/admin/articles*`）、站点配置；与 [`docs/艺考官网-需求说明.md`](docs/艺考官网-需求说明.md) 附录 C、根 [`README.md`](README.md) 一致。
- **产品/接口合同**：[`docs/艺考官网-需求说明.md`](docs/艺考官网-需求说明.md)；工程原则：[`docs/艺考官网-开发方案.md`](docs/艺考官网-开发方案.md)。

## 与本仓库其它 Skills 的联动

| Skill | 何时读 |
|-------|--------|
| [`frontend-automated-testing`](../frontend-automated-testing/SKILL.md) | 补/写前端测试（单元、组件、E2E），与 `apps/web` 现用测试栈对齐 |
| [`frontend-code-review`](../frontend-code-review/SKILL.md) | 审查 `apps/web` 改动、PR、或用户要「检查代码」 |
| [`frontend-performance-optimization`](../frontend-performance-optimization/SKILL.md) | 首屏、包体积、Web Vitals、Next 构建与资源策略 |
| [`frontend-beautify`](../frontend-beautify/SKILL.md) | 网页检索设计参考、精修视觉、整站/整页风格与间距一致 |

总览（含 Rules / Agents）见 [`cursor-workspace-index.mdc`](../../rules/cursor-workspace-index.mdc)。

## 必须遵守的约定

1. **统一响应包**（业务 JSON）：`code`、`message`、`data`；成功时 `code === 0`。错误码区间见需求文档 §6.3；实现见 `app/core/responses.py`、`app/core/errors.py`。
2. **新版本 API** 挂在 **`/api/v1`**；新路由按域拆到 `app/api/v1/*.py`，在 [`app/api/v1/router.py`](apps/api/app/api/v1/router.py) 汇总。
3. **数据库**：改模型后加 **Alembic revision**，不要只在应用里 `create_all` 代替迁移（除非团队明确允许的一次性脚本）。
4. **CORS**：后端默认放行 `localhost:3000` / `127.0.0.1:3000`；新增前端 origin 时改 [`app/config.py`](apps/api/app/config.py) 或环境变量 **`CORS_ORIGINS`**（逗号分隔）。
5. **改动范围**：与需求一致即可；未在 PRD 落地的端点可标「预留」或先不实现，避免口头扩张接口面。

## 常用命令（简表）

| 场景 | 命令 |
|------|------|
| 起 API | `cd apps/api && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` |
| 迁移 | `cd apps/api && alembic upgrade head` |
| 起前端 | `cd apps/web && npm run dev` |
| Postgres + 迁库（Docker） | 仓库根 `./scripts/postgres-docker-migrate.sh`（见 README） |
| 交互式 API 文档 | 浏览器打开 `http://127.0.0.1:8000/docs` |

更完整说明见仓库根目录 [`README.md`](README.md)。

## 实现新接口时的检查清单

- [ ] 路径与动词符合 PRD §6.4 资源划分（articles、leads、site…）。
- [ ] 返回使用 `ok()` / `err()`，列表分页与 PRD 一致（`page` + `pageSize` 等）。
- [ ] 需要写库的加模型 + migration；`POST /leads` 类公开写路径记得后续可接限流/幂等（需求已预留）。
- [ ] 前端若要展示：在 `lib/api.ts` 增加 fetch 封装，页面用 Server/Client 分清是否需 `NEXT_PUBLIC_*`。

## 不要做的事

- 不要把 Skill 文件写进 **`~/.cursor/skills-cursor/`**（系统保留目录）。
- 不要同时引入第二套 ORM/第二套 API 风格；不要忽略 `apps/api` 与 `apps/web` 的进程与端口分工（3000 页面 vs 8000 API）。
