import Link from "next/link";

export default function NewsArticleNotFound() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center px-5 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-stone-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      </div>
      <p className="mt-5 font-serif text-xl font-semibold text-stone-800">
        未找到该文章
      </p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
        可能已下线或链接有误。
      </p>
      <Link
        href="/news"
        className="tactile mt-6 inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/60 px-5 py-2.5 text-sm font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-stone-300 hover:text-stone-900"
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
    </section>
  );
}
