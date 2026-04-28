"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { useToast } from "@/components/ToastProvider";

const STATUSES = ["new", "contacted", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "新建",
  contacted: "已联系",
  done: "已完成",
};

export default function NewLeadPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [message, setMessage] = useState("");
  const [source, setSource] = useState("admin");
  const [status, setStatus] = useState<string>("new");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await adminFetch<{ id: string }>("/api/v1/admin/leads", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          wechat: wechat.trim() || null,
          message: message.trim() || null,
          source: source.trim() || "admin",
          status,
        }),
      });
      toast.success("已创建");
      if (res?.id) {
        window.setTimeout(() => router.push(`/admin/leads/${res.id}`), 200);
      } else {
        window.setTimeout(() => router.push("/admin/leads"), 200);
      }
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "创建失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-stone-500">
        <Link href="/admin/leads" className="text-stone-600 hover:underline">
          ← 返回列表
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-stone-900">新建预约信息</h1>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs text-stone-500">姓名</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">电话</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm tabular-nums"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={5}
            maxLength={32}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">微信（可选）</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={wechat}
            onChange={(e) => setWechat(e.target.value)}
            maxLength={64}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">留言（可选）</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">来源标识（如 admin、web）</label>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            maxLength={64}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">状态</label>
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s] ?? s}
              </option>
            ))}
          </select>
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
