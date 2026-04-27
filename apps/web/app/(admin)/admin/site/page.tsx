"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { useToast } from "@/components/ToastProvider";

type Site = {
  siteName: string;
  phone: string | null;
  address: string | null;
  icp: string | null;
};

export default function AdminSitePage() {
  const toast = useToast();
  const [f, setF] = useState<Site | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const { getApiBase } = await import("@/lib/api");
      const r = await fetch(`${getApiBase()}/api/v1/site/config`);
      const j = (await r.json()) as { code: number; data: Site; message: string };
      if (j.code !== 0 || !j.data) {
        throw new Error(j.message || "加载失败");
      }
      setF(j.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    setSaving(true);
    setErr(null);
    try {
      await adminFetch("/api/v1/admin/site/config", {
        method: "PUT",
        body: JSON.stringify({
          siteName: f.siteName,
          phone: f.phone,
          address: f.address,
          icp: f.icp,
        }),
      });
      await load();
      toast.success("站点信息已保存");
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "保存失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !f) {
    return <p className="text-sm text-stone-500">加载中…</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl font-semibold text-stone-900">站点信息</h1>
      <p className="mt-1 text-sm text-stone-500">与官网顶栏/页脚展示一致（公开接口只读）。</p>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs text-stone-500">站点名称</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.siteName}
            onChange={(e) => setF({ ...f, siteName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">电话</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.phone ?? ""}
            onChange={(e) => setF({ ...f, phone: e.target.value || null })}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">地址</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            rows={3}
            value={f.address ?? ""}
            onChange={(e) => setF({ ...f, address: e.target.value || null })}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">ICP 备案号</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.icp ?? ""}
            onChange={(e) => setF({ ...f, icp: e.target.value || null })}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </form>
    </div>
  );
}
