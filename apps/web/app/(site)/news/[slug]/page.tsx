import { ArticleMarkdown } from "@/components/ArticleMarkdown";
import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { fetchArticleBySlug } from "@/lib/api-server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const env = await fetchArticleBySlug(slug);
  if (!env || env.code !== 0 || !env.data) {
    return { title: "文章" };
  }
  return {
    title: env.data.title,
    description: env.data.excerpt || env.data.title,
  };
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const env = await fetchArticleBySlug(slug);
  if (!env || env.code !== 0 || !env.data) {
    notFound();
  }
  const a = env.data;
  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 section-rhythm">
      <ArtAtmosphere variant="news" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 sm:px-8 lg:px-10">
        {/* Back link */}
        <Link
          href="/news"
          className="animate-fade-in inline-flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          返回资讯动态
        </Link>

        {/* Article header */}
        <header className="animate-fade-up stagger-1 mt-8 border-b border-stone-200/70 pb-8 sm:mt-10">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-clay">
            考讯
          </p>
          <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {a.title}
          </h1>
          {a.publishedAt && (
            <p className="mt-4 text-sm text-stone-400">
              {formatTime(a.publishedAt)}
            </p>
          )}
        </header>

        {/* Article body */}
        <article className="animate-fade-up stagger-2 prose-news mt-8 max-w-none sm:mt-10">
          {a.excerpt && (
            <p className="mb-6 border-l-2 border-clay/30 pl-4 text-sm leading-relaxed text-stone-600">
              {a.excerpt}
            </p>
          )}
          <ArticleMarkdown content={a.body} />
        </article>

        {/* Back to list */}
        <div className="animate-fade-up stagger-3 mt-12 border-t border-stone-200/50 pt-8">
          <Link
            href="/news"
            className="tactile inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/60 px-5 py-2.5 text-sm font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-stone-300 hover:bg-white/80 hover:text-stone-900"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            返回列表
          </Link>
        </div>
      </div>
    </section>
  );
}
