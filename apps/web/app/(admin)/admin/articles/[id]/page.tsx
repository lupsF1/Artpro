"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { AdminArticleMdPreview } from "@/components/AdminArticleMdPreview";
import { useToast } from "@/components/ToastProvider";

type Article = {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string;
};

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function EditArticlePage() {
  const { id: raw } = useParams<{ id: string }>();
  const id = String(raw);
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<Article | null>(null);
  const [pub, setPub] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const a = await adminFetch<Article>(`/api/v1/admin/articles/${id}`);
      setF(a);
      setPub(isoToDatetimeLocal(a.published_at));
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
      const published_at = localToIso(pub);
      await adminFetch(`/api/v1/admin/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: f.title,
          slug: f.slug,
          body: f.body,
          excerpt: f.excerpt,
          published_at,
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
    if (!window.confirm("确定删除此文章？此操作不可恢复。")) return;
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/articles/${id}`, { method: "DELETE" });
      toast.success("已删除");
      window.setTimeout(() => router.replace("/admin/articles"), 200);
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
    <div className="max-w-2xl">
      <p className="text-sm text-stone-500">
        <Link href="/admin/articles" className="text-stone-600 hover:underline">
          ← 返回列表
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-stone-900">编辑文章</h1>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={onSave} className="mt-6 space-y-4">
        <div>
          <label className="text-xs text-stone-500">标题</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">slug</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.slug}
            onChange={(e) => setF({ ...f, slug: e.target.value.replace(/[^a-zA-Z0-9\-]/g, "") })}
            required
            pattern="[\w\-]+"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">摘要</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={f.excerpt ?? ""}
            onChange={(e) => setF({ ...f, excerpt: e.target.value || null })}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">正文（支持 Markdown：标题、列表、链接、表格等）</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            rows={12}
            value={f.body}
            onChange={(e) => setF({ ...f, body: e.target.value })}
          />
          <AdminArticleMdPreview body={f.body} />
        </div>
        <div>
          <label className="text-xs text-stone-500">发布时间（清空=草稿）</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={pub}
            onChange={(e) => setPub(e.target.value)}
          />
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
