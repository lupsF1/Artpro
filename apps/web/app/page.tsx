import { LeadForm } from "@/components/LeadForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchArticleList,
  fetchSiteConfig,
} from "@/lib/api";

export default async function HomePage() {
  let siteName = "ArtPro 艺考";
  let phone: string | null = null;
  let address: string | null = null;
  let icp: string | null = null;
  let apiError: string | null = null;
  let articles: { title: string; id: string }[] = [];

  try {
    const env = await fetchSiteConfig();
    if (env.code === 0 && env.data) {
      siteName = env.data.siteName;
      phone = env.data.phone;
      address = env.data.address;
      icp = env.data.icp;
    }
  } catch (e) {
    apiError = e instanceof Error ? e.message : "无法连接 API";
  }

  try {
    const list = await fetchArticleList({ page: 1, pageSize: 3 });
    if (list.code === 0 && list.data?.items?.length) {
      articles = list.data.items.map((a, index) => ({
        id: String(a.id ?? `idx-${index}`),
        title: a.title ?? "未命名",
      }));
    }
  } catch {
    /* 资讯接口不可用时仍展示首页其它模块 */
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader siteName={siteName} />

      <main>
        {/* 主视觉 */}
        <section
          id="hero"
          className="border-b border-neutral-200 bg-gradient-to-b from-neutral-100 to-white"
        >
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              播音 · 表演 · 编导 · 美术
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              {siteName}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-neutral-600">
              系统化教学、小班制辅导，助力考生科学规划考季、稳步提升专业与文化课成绩。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
              >
                预约咨询
              </a>
              <a
                href="#advantages"
                className="inline-flex rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                了解特色
              </a>
            </div>
            {(phone || address) && (
              <dl className="mt-10 grid gap-4 text-sm text-neutral-600 sm:grid-cols-2">
                {phone && (
                  <div>
                    <dt className="font-medium text-neutral-500">咨询电话</dt>
                    <dd className="mt-0.5">{phone}</dd>
                  </div>
                )}
                {address && (
                  <div>
                    <dt className="font-medium text-neutral-500">校区地址</dt>
                    <dd className="mt-0.5">{address}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </section>

        {apiError && (
          <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              无法连接后端 API（{apiError}）。站点名等将使用默认文案；请确认已启动{" "}
              <code className="rounded bg-white px-1">apps/api</code> 与{" "}
              <code className="rounded bg-white px-1">NEXT_PUBLIC_API_URL</code>。
            </p>
          </div>
        )}

        {/* 教学特色（占位，后续对接真实内容 / CMS） */}
        <section id="advantages" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-semibold text-neutral-900">教学特色</h2>
          <p className="mt-1 text-sm text-neutral-500">
            以下为展示占位，可在 PRD 定稿后替换为真实师资、班型与成绩数据。
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                t: "小班制分层",
                d: "按基础分班，针对性训练，关注每一位学员进度。",
              },
              {
                t: "艺考规划",
                d: "从报名、省考到校考，全程节点提醒与志愿策略建议。",
              },
              {
                t: "全真模考",
                d: "阶段性模拟考场与作品点评，提前适应考试节奏。",
              },
            ].map((item) => (
              <li
                key={item.t}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-medium text-neutral-900">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {item.d}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* 资讯动态 */}
        <section
          id="news"
          className="border-y border-neutral-200 bg-neutral-50/80 py-16"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-neutral-900">资讯动态</h2>
            <p className="mt-1 text-sm text-neutral-500">
              对接 <code className="rounded bg-neutral-100 px-1 text-xs">GET /api/v1/articles</code>
            </p>
            {articles.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-500">
                暂无文章。内容上线后，将在此展示最新考讯与活动通知。
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {articles.map((a, i) => (
                  <li
                    key={a.id || `article-row-${i}`}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800"
                  >
                    {a.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 咨询留资 */}
        <section id="contact" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2
            id="contact-heading"
            className="text-xl font-semibold text-neutral-900"
          >
            预约咨询
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            留下联系方式，我们会尽快与您沟通试听与课程安排。
          </p>
          <LeadForm />
        </section>
      </main>

      <SiteFooter siteName={siteName} icp={icp} />
    </div>
  );
}
