#!/usr/bin/env bash
# 关闭由 ./scripts/dev-start.sh 启动的 API (:8000) 与前端 (:3000)。
#
# 用法：仓库根目录执行 ./scripts/dev-stop.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNDIR="$ROOT/scripts/.dev-runtime"
API_PID="$RUNDIR/api.pid"
WEB_PID="$RUNDIR/web.pid"

listening_pids_for_port () {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
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

kill_pid_gracefully () {
  local pid="$1"
  [[ -z "$pid" ]] && return 0
  if ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 30); do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.2
  done
  kill -KILL "$pid" 2>/dev/null || true
}

fallback_kill_listen_port () {
  local port="$1" label="$2"
  local pids
  mapfile -t pids < <(listening_pids_for_port "$port")
  for p in "${pids[@]}"; do
    [[ -z "$p" ]] && continue
    echo "仍占用 ${label} 端口 ${port}，终止 PID ${p}"
    kill_pid_gracefully "$p"
  done
}

if [[ -f "$API_PID" ]]; then
  ap=$(cat "$API_PID" 2>/dev/null || true)
  rm -f "$API_PID"
  echo "终止 API PID ${ap:-（空）}"
  kill_pid_gracefully "${ap:-}"
else
  echo "未找到 $API_PID，跳过记录的 API PID。"
fi

if [[ -f "$WEB_PID" ]]; then
  wp=$(cat "$WEB_PID" 2>/dev/null || true)
  rm -f "$WEB_PID"
  echo "终止 Web PID ${wp:-（空）}"
  kill_pid_gracefully "${wp:-}"
else
  echo "未找到 $WEB_PID，跳过记录的 Web PID。"
fi

sleep 1
fallback_kill_listen_port 8000 "API"
fallback_kill_listen_port 3000 "前端"

echo "已完成关停（端口 8000 / 3000 应已释放）。"
echo "若仍有残留进程，可自行检查：lsof -ti tcp:8000 -sTCP:LISTEN｜tcp:3000"
