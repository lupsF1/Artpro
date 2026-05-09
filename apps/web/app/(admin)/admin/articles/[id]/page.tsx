"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminFetch, adminPipelineStream } from "@/lib/adminApi";
import { AdminArticleMdPreview } from "@/components/AdminArticleMdPreview";
import { useToast } from "@/components/ToastProvider";

type ArticleRevision = {
  id: string;
  article_id: string;
  kind: string;
  content: string;
  source: string;
  created_at: string;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  outline: string | null;
  pipeline_stage: string;
  published_at: string | null;
  updated_at: string;
};

const REV_TAB_LABEL: Record<string, string> = {
  outline: "大纲",
  body: "正文",
  excerpt: "摘要",
};

const PIPELINE_LABEL: Record<string, string> = {
  idle: "流水未启动",
  outlined: "已出大纲",
  drafted: "已出正文",
  excerpted: "已出摘要",
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
  const [pipelineBrief, setPipelineBrief] = useState("");
  const [pipelineBusy, setPipelineBusy] = useState<string | null>(null);
  const [revByKind, setRevByKind] = useState<{
    outline: ArticleRevision[];
    body: ArticleRevision[];
    excerpt: ArticleRevision[];
  }>({ outline: [], body: [], excerpt: [] });
  const [lastRevision, setLastRevision] = useState<ArticleRevision | null>(null);
  const [revTab, setRevTab] = useState<"outline" | "body" | "excerpt">("outline");
  const [applyBusy, setApplyBusy] = useState<string | null>(null);
  const [deleteRevisionBusy, setDeleteRevisionBusy] = useState<string | null>(null);
  const [streamPreview, setStreamPreview] = useState("");
  const [streamKind, setStreamKind] = useState<"outline" | "body" | "excerpt" | null>(null);
  const [needsRegenConfirm, setNeedsRegenConfirm] = useState({
    outline: false,
    body: false,
    excerpt: false,
  });

  const refreshRevisions = useCallback(async () => {
    try {
      const kinds = ["outline", "body", "excerpt"] as const;
      const results = await Promise.all(
        kinds.map((k) =>
          adminFetch<{ items: ArticleRevision[] }>(
            `/api/v1/admin/articles/${id}/revisions?kind=${k}&limit=50`,
          ),
        ),
      );
      setRevByKind({
        outline: results[0].items,
        body: results[1].items,
        excerpt: results[2].items,
      });
    } catch {
      /* 修订列表失败不阻断编辑 */
    }
  }, [id]);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const a = await adminFetch<Article>(`/api/v1/admin/articles/${id}`);
      setF(a);
      setPub(isoToDatetimeLocal(a.published_at));
      await refreshRevisions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast, refreshRevisions]);

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
          outline: f.outline,
          published_at,
        }),
      });
      toast.success("已保存");
      window.setTimeout(() => router.push("/admin/articles"), 200);
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "保存失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function runPipeline(step: "outline" | "body" | "excerpt") {
    if (!f) return;
    if (pipelineBusy) return;
    if (needsRegenConfirm[step]) {
      if (
        !window.confirm(
          "将重新调用模型生成新版本。当前流式预览会被替换；历史修订仍会保留。确定继续？",
        )
      ) {
        return;
      }
    }
    setPipelineBusy(step);
    setErr(null);
    setStreamPreview("");
    setStreamKind(step);
    setLastRevision(null);
    const path =
      step === "excerpt"
        ? `/api/v1/admin/articles/${id}/pipeline/excerpt`
        : step === "outline"
          ? `/api/v1/admin/articles/${id}/pipeline/outline`
          : `/api/v1/admin/articles/${id}/pipeline/body`;
    const body = step === "excerpt" ? "{}" : JSON.stringify({ brief: pipelineBrief });
    try {
      await adminPipelineStream(
        path,
        { method: "POST", body },
        {
          onDelta: (t) => setStreamPreview((p) => p + t),
          onDone: (revRec, artRec) => {
            const revision = revRec as unknown as ArticleRevision;
            const article = artRec as unknown as Article;
            setF(article);
            setLastRevision(revision);
            setRevTab(revision.kind as "outline" | "body" | "excerpt");
            setNeedsRegenConfirm((n) => ({ ...n, [step]: true }));
          },
        },
      );
      setStreamPreview("");
      setStreamKind(null);
      await refreshRevisions();
      toast.success("已生成，请预览下方后点击「采用此版」写入正式内容");
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "生成失败";
      setErr(msg);
      toast.error(msg);
      setStreamPreview("");
      setStreamKind(null);
    } finally {
      setPipelineBusy(null);
    }
  }

  async function applyRevision(revisionId: string) {
    setApplyBusy(revisionId);
    setErr(null);
    try {
      const next = await adminFetch<Article>(
        `/api/v1/admin/articles/${id}/revisions/${revisionId}/apply`,
        { method: "POST", body: "{}" },
      );
      setF(next);
      if (lastRevision?.id === revisionId) setLastRevision(null);
      await refreshRevisions();
      toast.success("已采用到正式内容");
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "采用失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setApplyBusy(null);
    }
  }

  async function deleteRevision(revisionId: string) {
    if (
      !window.confirm(
        "确定删除该条 AI 生成记录？不会改写已保存的正式大纲/正文/摘要。",
      )
    ) {
      return;
    }
    setDeleteRevisionBusy(revisionId);
    setErr(null);
    try {
      await adminFetch(`/api/v1/admin/articles/${id}/revisions/${revisionId}`, {
        method: "DELETE",
      });
      if (lastRevision?.id === revisionId) setLastRevision(null);
      await refreshRevisions();
      toast.success("已删除该条记录");
    } catch (e0: unknown) {
      const msg = e0 instanceof Error ? e0.message : "删除失败";
      setErr(msg);
      toast.error(msg);
    } finally {
      setDeleteRevisionBusy(null);
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

  const formalOutlineReady = (f.outline ?? "").trim().length > 0;
  const formalBodyReady = (f.body ?? "").trim().length > 0;

  return (
    <div className="flex min-w-0 max-w-[1920px] flex-col">
      <p className="text-sm text-stone-500">
        <Link href="/admin/articles" className="text-stone-600 hover:underline">
          ← 返回列表
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-stone-900">文章管理 · 编辑</h1>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <div className="mt-4 flex min-h-0 w-full flex-col gap-5 lg:mt-6 lg:h-[calc(100dvh-7.5rem)] lg:flex-row lg:gap-4">
        {/* 左：AI 流水线 */}
        <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-y-auto rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 lg:w-[300px] lg:max-w-[min(100%,320px)] lg:rounded-r-none xl:w-[320px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-violet-950">AI 生产流水线</h2>
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs text-violet-900 ring-1 ring-violet-200/80">
              {PIPELINE_LABEL[f.pipeline_stage] ?? f.pipeline_stage}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-violet-900/70">
            生成先进入<strong className="font-medium">修订</strong>，「采用」后写入正式字段；阶段角标在
            <strong className="font-medium">采用后</strong>更新。下一步生成依赖已保存的正式大纲/正文。需配置{" "}
            <code className="rounded bg-violet-100/80 px-1">MIMO_API_KEY</code> 或{" "}
            <code className="rounded bg-violet-100/80 px-1">OPENAI_API_KEY</code>。
            <span className="mt-1 block text-violet-900/65">
              大纲流式窗口中可能是模型原文；完成后写入修订的大纲会自动整理为「仅一行 ## 总标题，其余为
              ###」。
            </span>
          </p>
          <label className="mt-3 block text-xs text-violet-900/80">补充说明（可选）</label>
          <textarea
            className="mt-1 max-h-28 w-full rounded-xl border border-violet-200/80 bg-white/90 px-3 py-2 text-sm text-stone-900"
            rows={3}
            value={pipelineBrief}
            onChange={(e) => setPipelineBrief(e.target.value)}
            placeholder="侧重、受众、素材要点…"
          />
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={!!pipelineBusy}
              onClick={() => void runPipeline("outline")}
              className="rounded-xl bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-60"
            >
              {pipelineBusy === "outline" ? "生成大纲中…" : "1. 生成大纲"}
            </button>
            <button
              type="button"
              disabled={!!pipelineBusy || !formalOutlineReady}
              title={
                !formalOutlineReady ? "请先保存正式大纲或采用一版大纲修订" : undefined
              }
              onClick={() => void runPipeline("body")}
              className="rounded-xl border border-violet-300/90 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-60"
            >
              {pipelineBusy === "body" ? "生成正文中…" : "2. 根据大纲生成正文"}
            </button>
            <button
              type="button"
              disabled={!!pipelineBusy || !formalBodyReady}
              title={
                !formalBodyReady ? "请先保存正式正文或采用一版正文修订" : undefined
              }
              onClick={() => void runPipeline("excerpt")}
              className="rounded-xl border border-violet-300/90 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-60"
            >
              {pipelineBusy === "excerpt" ? "生成摘要中…" : "3. 生成摘要"}
            </button>
          </div>

          {pipelineBusy && streamKind && (
            <div className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/60 px-3 py-3">
              <p className="text-xs font-medium text-amber-950">
                正在生成（{REV_TAB_LABEL[streamKind]}）
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-amber-100/80 bg-white/90 p-2 text-sm">
                {streamKind === "excerpt" ? (
                  <p className="whitespace-pre-wrap text-stone-800">
                    {streamPreview}
                    <span className="inline-block w-1 animate-pulse bg-amber-700/60">&nbsp;</span>
                  </p>
                ) : (
                  <>
                    <AdminArticleMdPreview body={streamPreview} />
                    <span className="inline-block w-1 animate-pulse bg-amber-700/60">&nbsp;</span>
                  </>
                )}
              </div>
            </div>
          )}

          {!pipelineBusy && lastRevision && (
            <div className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/60 px-3 py-3">
              <p className="text-xs font-medium text-amber-950">
                最新生成（{REV_TAB_LABEL[lastRevision.kind] ?? lastRevision.kind} ·{" "}
                {lastRevision.created_at.replace("T", " ").slice(0, 19)}）
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-amber-100/80 bg-white/90 p-2 text-sm">
                {lastRevision.kind === "excerpt" ? (
                  <p className="whitespace-pre-wrap text-stone-800">{lastRevision.content}</p>
                ) : (
                  <AdminArticleMdPreview body={lastRevision.content} />
                )}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={
                    applyBusy === lastRevision.id ||
                    deleteRevisionBusy === lastRevision.id
                  }
                  onClick={() => void applyRevision(lastRevision.id)}
                  className="w-full rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {applyBusy === lastRevision.id ? "采用中…" : "采用此版到正式内容"}
                </button>
                <button
                  type="button"
                  disabled={
                    applyBusy === lastRevision.id ||
                    deleteRevisionBusy === lastRevision.id
                  }
                  onClick={() => void deleteRevision(lastRevision.id)}
                  className="w-full rounded-lg border border-red-200/90 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleteRevisionBusy === lastRevision.id ? "删除中…" : "删除此条记录"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-violet-200/60 bg-white/50 px-3 py-3">
            <p className="text-xs font-medium text-violet-950">生成历史</p>
            <p className="mt-1 text-[11px] leading-relaxed text-violet-900/65">
              超过 24 小时的记录由服务端定时清理（每轮间隔可配置）；可随时手动删除单条。
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(["outline", "body", "excerpt"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRevTab(k)}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    revTab === k
                      ? "bg-violet-700 text-white"
                      : "bg-violet-100/80 text-violet-900 hover:bg-violet-200/60"
                  }`}
                >
                  {REV_TAB_LABEL[k]}（{revByKind[k].length}）
                </button>
              ))}
            </div>
            <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto text-xs">
              {revByKind[revTab].length === 0 && (
                <li className="text-stone-500">暂无{REV_TAB_LABEL[revTab]}修订</li>
              )}
              {revByKind[revTab].map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-1 rounded-lg border border-stone-100 bg-stone-50/80 px-2 py-2"
                >
                  <span className="text-stone-600">
                    {r.created_at.replace("T", " ").slice(0, 19)}
                    <span className="mt-0.5 line-clamp-2 block text-stone-500">
                      {(r.content ?? "").slice(0, 120)}
                      {(r.content ?? "").length > 120 ? "…" : ""}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={
                        applyBusy === r.id || deleteRevisionBusy === r.id
                      }
                      onClick={() => void applyRevision(r.id)}
                      className="shrink-0 rounded-lg border border-violet-300 bg-white px-2 py-1 text-violet-900 hover:bg-violet-50 disabled:opacity-60"
                    >
                      {applyBusy === r.id ? "…" : "采用"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        applyBusy === r.id || deleteRevisionBusy === r.id
                      }
                      onClick={() => void deleteRevision(r.id)}
                      className="shrink-0 rounded-lg border border-red-200/90 bg-white px-2 py-1 text-red-800 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deleteRevisionBusy === r.id ? "…" : "删除"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* 中：正文编辑 */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:px-6">
          <form onSubmit={onSave} className="flex flex-col gap-4 pb-4">
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
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm font-mono"
                value={f.slug}
                onChange={(e) =>
                  setF({ ...f, slug: e.target.value.replace(/[^a-zA-Z0-9\-]/g, "") })
                }
                required
                pattern="[\w\-]+"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500">大纲（Markdown，保存时提交）</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white/90 px-3 py-2 font-mono text-xs text-stone-800"
                rows={8}
                value={f.outline ?? ""}
                onChange={(e) => setF({ ...f, outline: e.target.value || null })}
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
            <div className="min-h-0 flex flex-1 flex-col">
              <label className="text-xs text-stone-500">正文（Markdown）</label>
              <textarea
                className="mt-1 min-h-[200px] w-full flex-1 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm lg:min-h-[280px]"
                rows={16}
                value={f.body}
                onChange={(e) => setF({ ...f, body: e.target.value })}
              />
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
            <div className="flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-4">
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

        {/* 右：预览（摘要固定在上；大纲与正文共用一个滚动区域） */}
        <aside className="flex min-h-0 w-full shrink-0 flex-col gap-4 lg:min-h-0 lg:w-[34rem] lg:max-w-full lg:self-stretch xl:w-[38rem] 2xl:w-[42rem]">
          <div className="shrink-0 rounded-2xl border border-stone-200/80 bg-stone-50/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              摘要
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-800">
              {(f.excerpt ?? "").trim() ? (
                f.excerpt
              ) : (
                <span className="text-stone-400">暂无摘要</span>
              )}
            </p>
          </div>

          <div className="min-h-0 flex-1 rounded-2xl border border-stone-200/80 bg-stone-50/30 p-4">
              <section className="border-b border-stone-200/60 pb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  大纲预览
                </h3>
                <div className="mt-2 rounded-lg bg-white/90 p-3">
                  {(f.outline ?? "").trim() ? (
                    <AdminArticleMdPreview
                      body={f.outline ?? ""}
                      scrollBoxClassName="max-h-[calc((100dvh-15rem)/2)]"
                    />
                  ) : (
                    <p className="text-sm text-stone-400">
                      暂无大纲，可在中间栏填写或通过 AI 生成后采用。
                    </p>
                  )}
                </div>
              </section>
              <section className="pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  正文预览
                </h3>
                <div className="mt-2 rounded-lg bg-white/90 p-3">
                  <AdminArticleMdPreview
                    body={f.body}
                    scrollBoxClassName="max-h-[calc((100dvh-15rem)/2)]"
                  />
                </div>
              </section>
            </div>
        </aside>
      </div>
    </div>
  );
}
