"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, getAdminToken } from "@/lib/adminApi";
import { getApiBase } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type Row = {
  id: string;
  title: string;
  sourceFilename: string | null;
  status: string;
  reviewStatus: string;
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
};

type List = {
  items: Row[];
  meta: { page: number; pageSize: number; total: number };
};

export default function AdminKbPage() {
  const toast = useToast();
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await adminFetch<List>("/api/v1/admin/kb/documents?page=1&pageSize=100");
      setData(d);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setErr(msg);
      toast.error(msg);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(formData: FormData) {
    setBusy(true);
    setErr(null);
    try {
      const t = getAdminToken();
      const base = getApiBase().replace(/\/$/, "");
      const r = await fetch(`${base}/api/v1/admin/kb/documents`, {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: formData,
      });
      const j = (await r.json()) as { code: number; message: string; data?: unknown };
      if (!r.ok || j.code !== 0) {
        throw new Error(j?.message || r.statusText);
      }
      toast.success("已上传并处理");
      setTitle("");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "上传失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function setReview(id: string, reviewStatus: "draft" | "approved") {
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/kb/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ review_status: reviewStatus }),
      });
      toast.success(reviewStatus === "approved" ? "已批准入库" : "已改为待审");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "更新失败";
      setErr(msg);
      toast.error(msg);
    }
  }

  async function onDelete(id: string, title0: string) {
    if (!window.confirm(`确定删除知识库文档「${title0}」？`)) return;
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/kb/documents/${id}`, { method: "DELETE" });
      toast.success("已删除");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      setErr(msg);
      toast.error(msg);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-stone-900">知识库</h1>
      <p className="mt-1 text-sm text-stone-500">
        上传 PDF / Word，解析分块并向量化；
        <strong className="font-medium">批准</strong>
        后进入官网咨询助手检索。失败请查看错误信息（扫描件需 OCR）。
      </p>

      <form
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/60 p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (title.trim()) {
            fd.set("title", title.trim());
          }
          void onUpload(fd);
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <label className="block text-xs font-medium text-stone-600">
            可选标题（默认用文件名）
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200/90 bg-white px-3 py-2 text-sm"
              placeholder="如：2026 届招生简章要点"
              autoComplete="off"
            />
          </label>
          <label className="block text-xs font-medium text-stone-600">
            文件（.pdf / .docx）
            <input
              name="file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className="mt-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? "上传中…" : "上传并入库"}
        </button>
      </form>

      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

      <ul className="mt-8 space-y-2">
        {data?.items.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300/80 px-6 py-10 text-center text-sm text-stone-500">
            暂无文档
          </li>
        )}
        {data?.items.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-2 rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{row.title}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {row.sourceFilename ?? "—"} · 分块 {row.chunkCount} ·{" "}
                <span className="font-medium text-stone-600">{row.status}</span> ·{" "}
                {row.reviewStatus === "approved" ? (
                  <span className="text-emerald-700">已批准</span>
                ) : (
                  <span className="text-amber-700">待审</span>
                )}
              </p>
              {row.errorMessage ? (
                <p className="mt-1 text-xs text-red-700">{row.errorMessage}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {row.status === "ready" && row.reviewStatus === "draft" ? (
                <button
                  type="button"
                  onClick={() => void setReview(row.id, "approved")}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                >
                  批准检索
                </button>
              ) : null}
              {row.status === "ready" && row.reviewStatus === "approved" ? (
                <button
                  type="button"
                  onClick={() => void setReview(row.id, "draft")}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700"
                >
                  撤下
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void onDelete(row.id, row.title)}
                className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs text-red-800"
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
