"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { useToast } from "@/components/ToastProvider";

type Item = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string;
  pipeline_stage?: string;
};

type List = { items: Item[]; meta: { page: number; pageSize: number; total: number } };

const PIPELINE_LABEL: Record<string, string> = {
  idle: "流水未启动",
  outlined: "已出大纲",
  drafted: "已出正文",
  excerpted: "已出摘要",
};
const PAGE_SIZE = 20;

export default function AdminArticlesPage() {
  const toast = useToast();
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await adminFetch<List>(
        `/api/v1/admin/articles?page=${page}&pageSize=${PAGE_SIZE}`,
      );
      setData(d);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setErr(msg);
      toast.error(msg);
    }
  }, [page, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDeleteArticle(articleId: string, title: string) {
    if (!window.confirm(`确定删除「${title}」？此操作不可恢复。`)) return;
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/articles/${articleId}`, { method: "DELETE" });
      toast.success("已删除");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      setErr(msg);
      toast.error(msg);
    }
  }

  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-900">文章管理</h1>
          <p className="mt-1 text-sm text-stone-500">
            增删改查与发布：设置发布时间后将在官网资讯展示；留空为草稿。
            <span className="mt-1 block text-violet-900/80">
              AI 生产流水线在每条目的<strong className="font-medium">「编辑」</strong>页顶部（紫色区块）。
            </span>
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
        >
          新建文章
        </Link>
      </div>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <ul className="mt-6 space-y-2">
        {data?.items.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300/80 px-6 py-10 text-center text-sm text-stone-500">
            暂无文章
          </li>
        )}
        {data?.items.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white/80 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{a.title}</p>
              <p className="text-xs text-stone-500">
                /{a.slug} ·
                {a.published_at
                  ? ` 发布 ${a.published_at.replace("T", " ").slice(0, 16)}`
                  : " 草稿"}
                {a.pipeline_stage && a.pipeline_stage !== "idle"
                  ? ` · ${PIPELINE_LABEL[a.pipeline_stage] ?? a.pipeline_stage}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={`/admin/articles/${a.id}`}
                className="text-sm text-stone-600 underline underline-offset-2 hover:text-stone-900"
              >
                编辑
              </Link>
              <button
                type="button"
                className="text-sm text-red-700 underline underline-offset-2 hover:text-red-900"
                onClick={() => onDeleteArticle(a.id, a.title)}
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
      {data && totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-3 text-sm text-stone-600">
          <span>
            第 {data.meta.page} / {totalPages} 页，共 {total} 篇
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
