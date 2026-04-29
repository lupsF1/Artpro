import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { fetchArticleList } from "@/lib/api-server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "资讯动态",
  description: "考讯、活动通知与考季相关资讯。",
};

export default async function NewsPage() {
  let articles: { title: string; id: string; slug: string }[] = [];

  try {
    const list = await fetchArticleList(1, 20);
    if (list.code === 0 && list.data?.items?.length) {
      articles = list.data.items.map((a, index) => ({
        id: String(a.id ?? `idx-${index}`),
        slug: a.slug ?? "",
        title: a.title ?? "未命名",
      }));
    }
  } catch {
    /* 与首页行为一致，静默失败 */
  }

  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 section-rhythm">
      <ArtAtmosphere variant="news" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        {/* 标题区 */}
        <div className="flex items-start gap-4 sm:items-end sm:gap-5">
          <span className="shrink-0 font-display text-4xl font-bold leading-none text-stone-200 sm:text-5xl">
            02
          </span>
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-clay">
              <span className="inline-block h-px w-3 bg-clay/40" />
              考讯
            </p>
            <h1 className="mt-1.5 font-display text-display-md font-bold text-stone-900">
              资讯动态
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-[1.8] text-stone-500 sm:mt-5 sm:text-base">
              最新考讯、活动通知与考季提醒将在此发布，欢迎关注。
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="mt-14 sm:mt-18">
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-stone-300/50 bg-white/60 px-8 py-16 text-center sm:py-20">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blush/30">
                <span className="text-lg">📄</span>
              </div>
              <p className="text-sm font-medium text-stone-600">暂无文章</p>
              <p className="mt-1.5 text-xs text-stone-400">
                内容上线后，将在此展示最新考讯与活动通知。
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-14 space-y-3 sm:mt-18">
            {articles.map((a, i) => (
              <li
                key={a.id || `article-row-${i}`}
                className="group flex items-start gap-4 rounded-2xl border border-stone-200/50 bg-white/70 px-5 py-4 text-sm backdrop-blur-sm transition hover:border-stone-200/80 hover:shadow-soft sm:px-6 sm:py-5"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral/[0.08] font-mono text-[0.55rem] font-medium text-coral transition group-hover:bg-coral/[0.15]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {a.slug ? (
                    <Link
                      href={`/news/${encodeURIComponent(a.slug)}`}
                      className="block font-medium leading-snug text-stone-700 transition group-hover:text-stone-900"
                    >
                      {a.title}
                      <span className="ml-2 inline-block text-xs text-clay/0 transition group-hover:text-clay/60">
                        →
                      </span>
                    </Link>
                  ) : (
                    <p className="font-medium leading-snug text-stone-700">
                      {a.title}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}