# 协作开发（GitHub）

本文约定与朋友在 **GitHub** 上协作的流程；与根目录 [README.md](README.md) 中的运行方式、[docs/艺考官网-开发方案.md](docs/艺考官网-开发方案.md) 中的工程原则一并遵守。

## 安全与提交纪律

- **不要提交** `.env`、`apps/web/.env.local`、数据库文件、密钥；本仓库 [.gitignore](.gitignore) 已包含 `.env` / `.env.local`，提交前务必 `git status` 自查。
- 管理员密码仅存在于环境变量（见 README「环境」与 `.env.example`），勿写入代码或 PR 描述。

## 一次性：本地仓库关联 GitHub 并推送

1. 在 GitHub 上 **New repository**（若本地已有完整 Git 历史，建议**不要**勾选「Add a README」，避免无关的首次合并）。
2. 在本机仓库根目录执行（将 URL 换成你的仓库）：

```bash
git remote add origin https://github.com/<你的用户名或组织>/<仓库名>.git
git branch -M main
git push -u origin main
```

若已存在 `origin`，可用 `git remote -v` 查看；更换地址用 `git remote set-url origin <新 URL>`。

**SSH 示例**：`git@github.com:<用户>/<仓库>.git`

## 邀请协作者

- 仓库 **Settings → Collaborators**（私有库）添加对方 GitHub 账号；或公开仓库让对方 **Fork** 后提 PR。
- 对方克隆后建议配置身份（各机器一次）：

```bash
git config user.name "你的名字"
git config user.email "你的邮箱"
```

## 日常推荐循环（功能分支 + Pull Request）

1. 同步主分支：`git checkout main && git pull origin main`
2. 新建分支：`git checkout -b feature/简短说明`
3. 开发与提交：小步 `git commit`，说明清楚「做了什么」
4. 推送：`git push -u origin feature/简短说明`
5. 在 GitHub 上 **Open Pull Request** → Review → **Merge**（团队统一用 **Squash** 或 **Merge commit** 一种即可）
6. 合并后本地更新：`git checkout main && git pull origin main`，可删除本地分支：`git branch -d feature/简短说明`

## 合并冲突

在功能分支上执行：

```bash
git fetch origin
git merge origin/main
# 或：git rebase origin/main
```

解决冲突后 `git push`。一般由**分支作者**负责解决；不确定时在 PR 里沟通。

## 可选：保护主分支

在 GitHub **Settings → Branches** 为 `main` 开启 **Branch protection**（例如必须通过 PR、可选 1 人 approve），减少误推送。

## 与本项目相关的 PR 说明建议

- 若改动涉及 **数据库迁移**、**`.env` 新变量**，请在 PR 描述中写明，便于对方拉代码后能跑通（参见 README 中 PostgreSQL 与 `scripts/postgres-docker-migrate.sh`）。
- 接口或行为变更请同步 [docs/艺考官网-需求说明.md](docs/艺考官网-需求说明.md) 附录 C 或 README 接口表（若团队以此为准）。
