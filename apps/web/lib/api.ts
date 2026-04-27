/**
 * 浏览器端访问 FastAPI 基地址（CORS 需在后端放行本站 origin）
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}

type Envelope<T> = { code: number; message: string; data: T | null };

export async function fetchSiteConfig() {
  const r = await fetch(`${getApiBase()}/api/v1/site/config`, {
    next: { revalidate: 60 },
  });
  if (!r.ok) throw new Error(`site config: ${r.status}`);
  return (await r.json()) as Envelope<{
    siteName: string;
    phone: string | null;
    address: string | null;
    icp: string | null;
  }>;
}

export type ArticleListItem = {
  id: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
};

export async function fetchArticleList(params: { page?: number; pageSize?: number } = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 6;
  const r = await fetch(
    `${getApiBase()}/api/v1/articles?page=${page}&pageSize=${pageSize}`,
    { next: { revalidate: 60 } },
  );
  if (!r.ok) throw new Error(`articles: ${r.status}`);
  return (await r.json()) as Envelope<{
    items: ArticleListItem[];
    meta: { page: number; pageSize: number; total: number };
  }>;
}
