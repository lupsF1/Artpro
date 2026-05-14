#!/usr/bin/env bash
# 后台启动与本仓库 README「快速启动」一致：
# - API：uvicorn 127.0.0.1:8000（含 alembic upgrade head）
# - 前端：next dev → 默认 localhost:3000
#
# 用法：仓库根目录执行 ./scripts/dev-start.sh
# 关闭：./scripts/dev-stop.sh
# 若端口已被占用会先退出；可先 dev-stop.sh 或使用 --force-kill-port

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNDIR="$ROOT/scripts/.dev-runtime"
mkdir -p "$RUNDIR"
API_PID="$RUNDIR/api.pid"
WEB_PID="$RUNDIR/web.pid"
API_LOG="$RUNDIR/api.log"
WEB_LOG="$RUNDIR/web.log"

FORCE_KILL_PORT=0
for arg in "$@"; do
  case "$arg" in
    --force-kill-port) FORCE_KILL_PORT=1 ;;
    -h|--help)
      sed -n '1,12p' "$0"
      exit 0
      ;;
    *)
      echo "未知参数: $arg（支持 --force-kill-port）"
      exit 2
      ;;
  esac
done

listening_pids_for_port () {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    # -sTCP:LISTEN avoids matching clients talking to Postgres etc.
    lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true
    return 0
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${port}" 2>/dev/null | awk '{print $NF}' \
      | grep -Eo 'pid=[0-9]+' \
      | cut -d= -f2 \
      | sort -u || true
  fi
}

kill_ports_if_forced () {
  if [[ "${FORCE_KILL_PORT}" -eq 1 ]]; then
    for port in 8000 3000; do
      mapfile -t pids < <(listening_pids_for_port "$port")
      for p in "${pids[@]}"; do
        [[ -z "$p" ]] && continue
        echo "FORCE: 终止占用端口 ${port} 的 PID ${p}"
        kill -TERM "$p" 2>/dev/null || true
      done
    done
    sleep 1
  fi
}

port_free_or_exit () {
  local port="$1" name="$2"
  local pids
  mapfile -t pids < <(listening_pids_for_port "$port")
  # shellcheck disable=SC2128
  if [[ -n "${pids[*]:-}" ]]; then
    echo "端口 ${port}（${name}）已被占用：${pids[*]}"
    echo "可先执行 ./scripts/dev-stop.sh，或用：./scripts/dev-start.sh --force-kill-port"
    exit 1
  fi
}

ensure_not_running_same_launcher () {
  if [[ -f "$API_PID" ]] && pid=$(cat "$API_PID" 2>/dev/null || true); then
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "API 已通过本脚本运行（PID ${pid}）。请先 ./scripts/dev-stop.sh。"
      exit 1
    fi
  fi
  if [[ -f "$WEB_PID" ]] && pid=$(cat "$WEB_PID" 2>/dev/null || true); then
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "前端已通过本脚本运行（PID ${pid}）。请先 ./scripts/dev-stop.sh。"
      exit 1
    fi
  fi
}

ensure_not_running_same_launcher
kill_ports_if_forced
port_free_or_exit 8000 "API"
port_free_or_exit 3000 "Web"

ACTIVATE=""
if [[ -f "$ROOT/.venv/bin/activate" ]]; then
  ACTIVATE="$ROOT/.venv/bin/activate"
fi

rm -f "$API_LOG" "$WEB_LOG"

(
  cd "$ROOT/apps/api"
  if [[ -n "$ACTIVATE" ]]; then
    # shellcheck source=/dev/null
    source "$ACTIVATE"
  fi
  set +e
  alembic upgrade head
  ale_status=$?
  set -e
  if [[ "$ale_status" -ne 0 ]]; then
    echo "WARNING: alembic upgrade head 退出码 ${ale_status}，仍尝试启动 uvicorn（见日志）." >&2
  fi
  exec uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) >>"$API_LOG" 2>&1 &
echo $! >"$API_PID"

(
  cd "$ROOT/apps/web"
  exec npm run dev
) >>"$WEB_LOG" 2>&1 &
echo $! >"$WEB_PID"

echo "已启动。"
echo "  API  PID $(cat "$API_PID") → 日志 $API_LOG （http://127.0.0.1:8000）"
echo "  Web PID $(cat "$WEB_PID") → 日志 $WEB_LOG （http://localhost:3000）"
echo "关闭： ./scripts/dev-stop.sh"
