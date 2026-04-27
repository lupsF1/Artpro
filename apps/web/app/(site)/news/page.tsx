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
    <section className="relative w-full min-w-0 min-h-0 flex-1 border-b border-stone-200/45 bg-stone-100/60 py-24 backdrop-blur-[2px] sm:py-32">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-grid-fine opacity-25"
          aria-hidden
        />
        <ArtAtmosphere variant="news" />
        <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
          <div className="flex items-start gap-4 sm:items-end sm:gap-5">
            <span className="shrink-0 font-serif text-4xl font-semibold leading-none text-stone-200 sm:text-5xl">
              02
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-stone-500">
                考讯
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                资讯动态
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:mt-4 sm:text-base">
                最新考讯、活动通知与考季提醒将在此发布，欢迎关注。
              </p>
            </div>
          </div>
          {articles.length === 0 ? (
            <p className="mt-14 rounded-2xl border border-dashed border-stone-300/60 bg-white/60 px-8 py-16 text-center text-sm text-stone-500 backdrop-blur sm:mt-20 sm:py-20">
              暂无文章。内容上线后，将在此展示最新考讯与活动通知。
            </p>
          ) : (
            <ul className="mt-14 space-y-3 sm:mt-20">
              {articles.map((a, i) => (
                <li
                  key={a.id || `article-row-${i}`}
                  className="group flex items-start gap-4 rounded-2xl border border-stone-200/50 bg-white/85 px-5 py-4 text-sm text-stone-800 shadow-sm backdrop-blur transition hover:border-stone-300/80 hover:shadow-soft sm:px-6 sm:py-5"
                >
                  <span
                    className="mt-0.5 h-2 w-0.5 shrink-0 rounded-full bg-stone-300 group-hover:h-2.5 group-hover:bg-stone-500"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    {a.slug ? (
                      <Link
                        href={`/news/${encodeURIComponent(a.slug)}`}
                        className="block font-medium leading-snug text-stone-800 underline decoration-stone-300/80 decoration-1 underline-offset-2 transition group-hover:text-stone-900 group-hover:decoration-stone-500"
                      >
                        {a.title}
                      </Link>
                    ) : (
                      <p className="font-medium leading-snug text-stone-800">
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
