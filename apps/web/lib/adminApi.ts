/**
 * 管理端 API 调用：Bearer token 存 localStorage（与官网同源、不同 path）。
 */
import { getApiBase } from "./api";

const TOKEN_KEY = "artpro_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type Envelope<T> = { code: number; message: string; data: T | null };

function apiUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function adminLogin(
  username: string,
  password: string,
): Promise<{ access_token: string; expires_in: number }> {
  const r = await fetch(apiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const j = (await r.json()) as Envelope<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
  if (!r.ok || j.code !== 0 || !j.data) {
    throw new Error(j?.message || r.statusText || "登录失败");
  }
  return {
    access_token: j.data.access_token,
    expires_in: j.data.expires_in,
  };
}

function buildHeaders(
  t: string | null,
  init?: HeadersInit,
): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init) {
    if (init instanceof Headers) {
      init.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(init)) {
      for (const [k, v] of init) headers[k] = v;
    } else {
      Object.assign(headers, init);
    }
  }
  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }
  return headers;
}

export type PipelineStreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "done";
      revision: Record<string, unknown>;
      article: Record<string, unknown>;
    }
  | { type: "error"; code: number; message: string };

function flushSseBuffer(
  buffer: string,
): { rest: string; events: PipelineStreamEvent[] } {
  const events: PipelineStreamEvent[] = [];
  let rest = buffer;
  while (true) {
    const idx = rest.indexOf("\n\n");
    if (idx === -1) break;
    const block = rest.slice(0, idx).replace(/\r/g, "");
    rest = rest.slice(idx + 2);
    const line = block.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as PipelineStreamEvent);
    } catch {
      /* 忽略畸形帧 */
    }
  }
  return { rest, events };
}

/**
 * 文章流水线：SSE (`text/event-stream`)，帧为 JSON：`delta` | `done` | `error`。
 */
export async function adminPipelineStream(
  path: string,
  init: RequestInit & { body?: string },
  handlers: {
    onDelta: (text: string) => void;
    onDone: (revision: Record<string, unknown>, article: Record<string, unknown>) => void;
  },
): Promise<void> {
  const t = getAdminToken();
  const headers = buildHeaders(t, init.headers);
  headers.Accept = "text/event-stream";
  const r = await fetch(apiUrl(path), {
    ...init,
    method: init.method ?? "POST",
    headers,
    body: init.body ?? "{}",
  });

  const ct = r.headers.get("content-type") ?? "";

  if (r.status === 401) {
    setAdminToken(null);
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = `/admin/login?next=${encodeURIComponent(next)}`;
      }
    }
    let message = "未授权，请重新登录";
    try {
      const j = (await r.json()) as Envelope<unknown>;
      message = j?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (!ct.includes("text/event-stream")) {
    try {
      const j = (await r.json()) as Envelope<unknown>;
      if (!r.ok || j.code !== 0) {
        throw new Error(j?.message || r.statusText || "生成失败");
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(r.statusText || "生成失败");
    }
    throw new Error("未收到流式响应");
  }

  if (!r.ok || !r.body) {
    throw new Error(r.statusText || "生成失败");
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buf += decoder.decode(value, { stream: true });
    }
    const { rest, events } = flushSseBuffer(buf);
    buf = rest;
    for (const ev of events) {
      if (ev.type === "delta" && typeof ev.text === "string") {
        handlers.onDelta(ev.text);
      } else if (ev.type === "done" && ev.revision && ev.article) {
        handlers.onDone(ev.revision, ev.article);
        await reader.cancel().catch(() => {});
        return;
      } else if (ev.type === "error") {
        await reader.cancel().catch(() => {});
        throw new Error(ev.message ?? "生成失败");
      }
    }
    if (done) {
      const { events: finalEvents } = flushSseBuffer(buf + decoder.decode());
      for (const ev of finalEvents) {
        if (ev.type === "delta" && typeof ev.text === "string") {
          handlers.onDelta(ev.text);
        } else if (ev.type === "done" && ev.revision && ev.article) {
          handlers.onDone(ev.revision, ev.article);
          return;
        } else if (ev.type === "error") {
          throw new Error(ev.message ?? "生成失败");
        }
      }
      throw new Error("流已结束但未收到完成帧");
    }
  }
}

export async function adminFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const t = getAdminToken();
  const r = await fetch(apiUrl(path), {
    ...init,
    headers: buildHeaders(t, init.headers),
  });
  let j: Envelope<T>;
  try {
    j = (await r.json()) as Envelope<T>;
  } catch {
    throw new Error("服务器返回异常，请稍后再试");
  }
  if (r.status === 401) {
    setAdminToken(null);
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = `/admin/login?next=${encodeURIComponent(next)}`;
      }
    }
    throw new Error(j?.message || "未授权，请重新登录");
  }
  if (!r.ok || j.code !== 0) {
    throw new Error(j?.message || r.statusText);
  }
  return j.data as T;
}

/** 供 `ToastProvider` 及非 React 处（如 401 跳转前）触发展示 */
export const ADMIN_TOAST_EVENT = "artpro:admin-toast" as const;

export function emitAdminToast(
  variant: "success" | "error",
  message: string,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ADMIN_TOAST_EVENT, { detail: { variant, message } }),
  );
}
