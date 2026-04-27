import Link from "next/link";

export default function NewsArticleNotFound() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-serif text-xl text-stone-800">未找到该文章</p>
      <p className="mt-2 text-sm text-stone-500">
        可能已下线或链接有误。
      </p>
      <Link
        href="/news"
        className="mt-6 text-sm text-stone-600 underline underline-offset-2"
      >
        返回资讯动态
      </Link>
    </section>
  );
}
