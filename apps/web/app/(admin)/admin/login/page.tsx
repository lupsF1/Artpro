"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { adminLogin, setAdminToken } from "@/lib/adminApi";
import { useToast } from "@/components/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const t = await adminLogin(username, password);
      setAdminToken(t.access_token);
      toast.success("登录成功");
      const next = sp.get("next");
      const dest = next && next.startsWith("/admin") ? next : "/admin/leads";
      window.setTimeout(() => router.replace(dest), 200);
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "登录失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5">
      <h1 className="font-serif text-2xl font-semibold text-stone-900">管理端登录</h1>
      <p className="mt-2 text-sm text-stone-500">使用环境变量中配置的管理员账号登录。</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs text-stone-500">用户名</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">密码</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-60"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
      <p className="mt-8 text-center text-xs text-stone-400">
        <Link href="/" className="underline underline-offset-2 hover:text-stone-600">
          返回官网
        </Link>
      </p>
    </div>
  );
}
