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
