#!/usr/bin/env bash
# 在仓库根执行：启动 docker-compose 中的 Postgres，并运行 Alembic 到最新。
# 需已安装 Docker、根目录 .env 已配置 DATABASE_URL / DATABASE_URL_SYNC（Postgres）。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "未找到 docker。在 WSL/Ubuntu 可安装（需输入 sudo 密码）："
  echo ""
  echo "  sudo apt-get update"
  echo "  sudo apt-get install -y docker.io docker-compose-v2"
  echo "  sudo usermod -aG docker \"\$USER\""
  echo "  # 关闭并重新打开 WSL，或: newgrp docker"
  echo "  docker run --rm hello-world"
  echo ""
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker 守护进程不可用。可尝试："
  echo "  sudo service docker start"
  echo "若使用 Docker Desktop for Windows，请在 Windows 侧启动并启用「WSL 集成」。"
  exit 1
fi

docker compose up -d

ready=0
for _ in $(seq 1 40); do
  if docker compose exec -T db pg_isready -U artpro -d artpro >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then
  echo "等待 Postgres 就绪超时。请检查: docker compose logs db"
  exit 1
fi

VENV_ACTIVATE="$ROOT/.venv/bin/activate"
if [[ ! -f "$VENV_ACTIVATE" ]]; then
  echo "未找到 $VENV_ACTIVATE，请先创建虚拟环境并 pip install -r apps/api/requirements.txt"
  exit 1
fi
# shellcheck source=/dev/null
source "$VENV_ACTIVATE"
cd "$ROOT/apps/api"
alembic upgrade head

echo "完成：Postgres 已运行且 Alembic 已到 head。可启动: cd apps/api && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
