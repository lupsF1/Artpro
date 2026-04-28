"use client";

import Link from "next/link";
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

type ListData = {
  items: Lead[];
  meta: { page: number; pageSize: number; total: number };
};

const STATUSES = ["new", "contacted", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "新建",
  contacted: "已联系",
  done: "已完成",
};

export default function AdminLeadsPage() {
  const toast = useToast();
  const [data, setData] = useState<ListData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await adminFetch<ListData>("/api/v1/admin/leads?page=1&pageSize=50");
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

  async function onStatusChange(id: string, status: string) {
    setUpdating(id);
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success("状态已更新");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "更新失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setUpdating(null);
    }
  }

  async function onDeleteRow(leadId: string, name: string) {
    if (!window.confirm(`确定删除「${name}」的预约信息？此操作不可恢复。`)) return;
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/leads/${leadId}`, { method: "DELETE" });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-900">预约信息</h1>
          <p className="mt-1 text-sm text-stone-500">
            官网留资与后台录入，支持列表、新建、编辑与删除。
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
        >
          新建预约
        </Link>
      </div>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200/80 bg-white/80">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">姓名</th>
              <th className="px-4 py-3 font-medium">电话</th>
              <th className="px-4 py-3 font-medium">来源</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">留言</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                  暂无数据
                </td>
              </tr>
            )}
            {data?.items.map((row) => (
              <tr key={row.id} className="border-b border-stone-100/90">
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {row.created_at?.replace("T", " ").slice(0, 19)}
                </td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 tabular-nums">{row.phone}</td>
                <td className="px-4 py-3 text-stone-600">{row.source ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs"
                    value={row.status}
                    disabled={updating === row.id}
                    onChange={(e) => onStatusChange(row.id, e.target.value)}
                    aria-label={`${row.name} 的状态`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s] ?? s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-stone-600" title={row.message ?? ""}>
                  {row.message || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/admin/leads/${row.id}`}
                    className="text-stone-600 underline underline-offset-2 hover:text-stone-900"
                  >
                    编辑
                  </Link>
                  <button
                    type="button"
                    className="ml-3 text-xs text-red-700 underline underline-offset-2 hover:text-red-900"
                    onClick={() => onDeleteRow(row.id, row.name)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <p className="border-t border-stone-200/60 px-4 py-2 text-xs text-stone-500">
            共 {data.meta.total} 条 · 本页 {data.items.length} 条
          </p>
        )}
      </div>
    </div>
  );
}
