"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { AdminArticleMdPreview } from "@/components/AdminArticleMdPreview";
import { useToast } from "@/components/ToastProvider";

function isoOrNull(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function NewArticlePage() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(""); // datetime-local
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const pub = isoOrNull(published);
      const res = await adminFetch<{ id: string }>("/api/v1/admin/articles", {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || null,
          body,
          published_at: pub,
        }),
      });
      if (res?.id) {
        toast.success("文章已创建");
        window.setTimeout(() => router.push(`/admin/articles/${res.id}`), 200);
        return;
      }
      toast.success("文章已创建");
      window.setTimeout(() => router.push("/admin/articles"), 200);
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "创建失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-stone-500">
        <Link href="/admin/articles" className="text-stone-600 hover:underline">
          ← 返回列表
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-stone-900">文章管理 · 新建</h1>
      <p className="mt-2 text-sm text-violet-900/80">
        保存后将进入编辑页，在顶部可使用 <strong className="font-medium">AI 生产流水线</strong>（生成大纲 / 正文 / 摘要）。
      </p>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs text-stone-500">标题</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">slug（URL 段，仅字母数字与连字符）</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9\-]/g, ""))}
            required
            pattern="[\w\-]+"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">摘要（可选）</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">正文（支持 Markdown：标题、列表、链接、表格等）</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <AdminArticleMdPreview body={body} />
        </div>
        <div>
          <label className="text-xs text-stone-500">发布时间（留空=草稿；本地时间）</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={published}
            onChange={(e) => setPublished(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-60"
        >
          {loading ? "创建中…" : "创建"}
        </button>
      </form>
    </div>
  );
}
