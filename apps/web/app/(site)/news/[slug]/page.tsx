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
    <section className="relative w-full min-w-0 min-h-0 flex-1 border-b border-stone-200/45 bg-stone-100/60 py-20 backdrop-blur-[2px] sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-grid-fine opacity-25"
        aria-hidden
      />
      <ArtAtmosphere variant="news" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 sm:px-8 lg:px-10">
        <p className="text-sm text-stone-500">
          <Link
            href="/news"
            className="text-stone-600 underline decoration-stone-300 underline-offset-2 transition hover:text-stone-800"
          >
            ← 返回资讯动态
          </Link>
        </p>
        <header className="mt-5 border-b border-stone-200/70 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-stone-500">
            考讯
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {a.title}
          </h1>
          {a.publishedAt && (
            <p className="mt-3 text-sm text-stone-500">
              {formatTime(a.publishedAt)}
            </p>
          )}
        </header>
        <article className="prose-news mt-8 max-w-none">
          {a.excerpt && (
            <p className="mb-6 border-l-2 border-stone-300/80 pl-4 text-sm leading-relaxed text-stone-600">
              {a.excerpt}
            </p>
          )}
          <ArticleMarkdown content={a.body} />
        </article>
      </div>
    </section>
  );
}
