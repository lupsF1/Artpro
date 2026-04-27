import { LeadForm } from "@/components/LeadForm";
import { fetchSiteConfig } from "@/lib/api";

export default async function HomePage() {
  let siteName = "ArtPro 艺考";
  let apiError: string | null = null;
  try {
    const env = await fetchSiteConfig();
    if (env.code === 0 && env.data) siteName = env.data.siteName;
  } catch (e) {
    apiError = e instanceof Error ? e.message : "无法连接 API";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{siteName}</h1>
      <p className="mt-2 text-neutral-600">
        方案 B 骨架页：从 FastAPI 读取站点配置，并提交留资到{" "}
        <code className="rounded bg-neutral-100 px-1 text-sm">/api/v1</code>。
      </p>
      {apiError && (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          API 未就绪：{apiError}。请先启动{" "}
          <code className="rounded bg-white px-1">apps/api</code> 并确认{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_API_URL</code>。
        </p>
      )}
      <LeadForm />
    </main>
  );
}
