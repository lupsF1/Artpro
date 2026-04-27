import "server-only";

import { cache } from "react";
import { getApiBase } from "./api";
import { parseJsonEnvelope, type Envelope } from "./parseJsonEnvelope";

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
};

export type ArticleDetail = {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  publishedAt: string | null;
};

async function readEnvelope<T>(r: Response, context: string): Promise<Envelope<T>> {
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`${context}: HTTP ${r.status}`);
  }
  return parseJsonEnvelope<T>(text, context);
}

export const fetchSiteConfig = cache(async () => {
  const r = await fetch(`${getApiBase()}/api/v1/site/config`, {
    next: { revalidate: 60 },
  });
  return readEnvelope<{
    siteName: string;
    phone: string | null;
    address: string | null;
    icp: string | null;
  }>(r, "site/config");
});

export const fetchArticleList = cache(
  async (page: number, pageSize: number) => {
    const r = await fetch(
      `${getApiBase()}/api/v1/articles?page=${page}&pageSize=${pageSize}`,
      { next: { revalidate: 60 } },
    );
    return readEnvelope<{
      items: ArticleListItem[];
      meta: { page: number; pageSize: number; total: number };
    }>(r, "articles");
  },
);

export const fetchArticleBySlug = cache(async (slug: string) => {
  const r = await fetch(
    `${getApiBase()}/api/v1/articles/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } },
  );
  if (r.status === 404) {
    return null;
  }
  return readEnvelope<ArticleDetail>(r, `articles/${slug}`);
});
