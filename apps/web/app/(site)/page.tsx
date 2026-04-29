import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchSiteConfig } from "@/lib/api-server";
import { trustTags } from "@/lib/site-content";
import Link from "next/link";

export default async function HomePage() {
  let siteName = "丝育教育";
  let phone: string | null = null;
  let address: string | null = null;
  let icp: string | null = null;
  let apiError: string | null = null;

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

  return (
    <>
      <div className="flex w-full min-w-0 flex-1 flex-col">
        {/* ═══ Hero：全屏 ═══ */}
        <section
          id="hero"
          className="relative flex min-h-dvh w-full min-w-0 flex-col overflow-hidden"
        >
          <ArtAtmosphere variant="home" />

          {/* 大胆几何色块：右上珊瑚 */}
          <div
            className="pointer-events-none absolute -right-12 top-[10%] h-[22rem] w-[22rem] rounded-[3rem] bg-coral/[0.12] rotate-6 blur-none sm:h-[28rem] sm:w-[28rem] sm:rounded-[4rem] md:right-[-2%] md:h-[34rem] md:w-[34rem]"
            aria-hidden
          />
          {/* 左下暖粉 */}
          <div
            className="pointer-events-none absolute -bottom-8 left-[8%] h-[14rem] w-[14rem] rounded-full bg-blush/[0.18] blur-none sm:h-[18rem] sm:w-[18rem]"
            aria-hidden
          />

          {/* Hero 主内容 */}
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pt-24 pb-16 sm:px-8 sm:pt-32 lg:px-10">
            {/* 专业标签 */}
            <div className="animate-fade-in flex items-center gap-3">
              <span className="h-px w-8 bg-clay/40" />
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-clay sm:text-xs">
                播音 · 表演 · 编导 · 美术
              </p>
            </div>

            {/* 主标题 */}
            <h1 className="animate-fade-up mt-8 max-w-4xl font-display text-display-xl font-bold text-stone-900 [animation-delay:0.05s]">
              {siteName}
            </h1>

            {/* 副标题 */}
            <p className="animate-fade-up mt-6 max-w-xl text-balance text-base leading-[1.8] text-stone-500 [animation-delay:0.1s] sm:mt-8 sm:text-lg">
              系统化教学、小班制辅导，助力考生科学规划考季、
              <br className="hidden sm:block" />
              稳步提升专业与文化课成绩。
            </p>

            {/* 信任标签 */}
            <div
              className="animate-fade-up mt-10 flex max-w-2xl flex-wrap gap-2.5 [animation-delay:0.15s] sm:mt-12"
              aria-label="服务亮点"
            >
              {trustTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-stone-200/70 bg-white/60 px-3.5 py-1.5 text-[0.68rem] font-medium text-stone-600 backdrop-blur-sm sm:text-[0.75rem]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA 按钮组 */}
            <div className="animate-fade-up mt-12 flex flex-wrap items-center gap-4 [animation-delay:0.2s] sm:mt-14">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center rounded-full bg-clay px-8 py-3.5 text-sm font-semibold text-white shadow-warm transition-all hover:bg-clay-dark"
              >
                预约咨询
                <span
                  className="ml-1.5 inline-block transition group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </Link>
              <Link
                href="/teaching"
                className="inline-flex rounded-full border border-stone-200/80 bg-white/60 px-8 py-3.5 text-sm font-medium text-stone-700 backdrop-blur-sm transition-all hover:border-stone-300 hover:bg-white/80 hover:text-stone-900"
              >
                了解特色
              </Link>
            </div>

            {/* 联系信息 */}
            {(phone || address) && (
              <dl className="animate-fade-up mt-20 grid gap-10 border-t border-stone-200/50 pt-12 sm:grid-cols-2 sm:gap-16 [animation-delay:0.25s]">
                {phone && (
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                      <span className="inline-block h-3.5 w-px bg-clay/30" />
                      咨询电话
                    </dt>
                    <dd className="mt-3 font-serif text-base font-medium tracking-tight text-stone-800 sm:text-lg">
                      {phone}
                    </dd>
                  </div>
                )}
                {address && (
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                      <span className="inline-block h-3.5 w-px bg-clay/30" />
                      校区地址
                    </dt>
                    <dd className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                      {address}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* 底部滚动提示 */}
          <div className="relative z-10 flex justify-center pb-10">
            <div className="flex flex-col items-center gap-2 text-stone-300">
              <span className="text-[0.65rem] uppercase tracking-[0.2em]">Scroll</span>
              <span className="h-8 w-px bg-gradient-to-b from-stone-300 to-transparent" />
            </div>
          </div>
        </section>

        <SiteFooter siteName={siteName} icp={icp} />

        {apiError && (
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
            <p className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-6 py-5 text-sm leading-relaxed text-amber-900/80">
              无法连接后端 API（{apiError}）。站点名等将使用默认文案；请确认已启动{" "}
              <code className="rounded-md bg-white/80 px-1.5 py-0.5 text-amber-950/90">
                apps/api
              </code>{" "}
              与{" "}
              <code className="rounded-md bg-white/80 px-1.5 py-0.5 text-amber-950/90">
                NEXT_PUBLIC_API_URL
              </code>
              。
            </p>
          </div>
        )}
      </div>
    </>
  );
}