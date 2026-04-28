"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { useToast } from "@/components/ToastProvider";

type Lead = {
  id: string;
  name: string;
  phone: string;
  wechat: string | null;
  message: string | null;
  source: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "新建",
  contacted: "已联系",
  done: "已完成",
};

export default function EditLeadPage() {
  const { id: raw } = useParams<{ id: string }>();
  const id = String(raw);
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<Lead | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const row = await adminFetch<Lead>(`/api/v1/admin/leads/${id}`);
      setF(row);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    setSaving(true);
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: f.name.trim(),
          phone: f.phone.trim(),
          wechat: f.wechat?.trim() || null,
          message: f.message?.trim() || null,
          source: f.source?.trim() || null,
          status: f.status.trim() || "new",
        }),
      });
      await load();
      toast.success("已保存");
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "保存失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("确定删除此条预约信息？此操作不可恢复。")) return;
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/leads/${id}`, { method: "DELETE" });
      toast.success("已删除");
      window.setTimeout(() => router.replace("/admin/leads"), 200);
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "删除失败";
      setErr(msg);
      toast.error(msg);
    }
  }

  if (loading || !f) {
    return <p className="text-sm text-stone-500">{err || "加载中…"}</p>;
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-stone-500">
        <Link href="/admin/leads" className="text-stone-600 hover:underline">
          ← 返回列表
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-stone-900">编辑预约信息</h1>
      <p className="mt-1 text-xs text-stone-500">
        提交时间 {f.created_at?.replace("T", " ").slice(0, 19)}
      </p>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={onSave} className="mt-6 space-y-4">
        <div>
          <label className="text-xs text-stone-500">姓名</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">电话</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm tabular-nums"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
            required
            minLength={5}
            maxLength={32}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">微信</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.wechat ?? ""}
            onChange={(e) => setF({ ...f, wechat: e.target.value || null })}
            maxLength={64}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">留言</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            rows={4}
            value={f.message ?? ""}
            onChange={(e) => setF({ ...f, message: e.target.value || null })}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">来源</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.source ?? ""}
            onChange={(e) => setF({ ...f, source: e.target.value || null })}
            maxLength={64}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">状态</label>
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-60"
          >
            {saving ? "保存中…" : "保存"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-2.5 text-sm text-red-800 transition hover:bg-red-100/80"
          >
            删除
          </button>
        </div>
      </form>
    </div>
  );
}
