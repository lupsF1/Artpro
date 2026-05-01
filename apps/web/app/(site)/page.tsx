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
        {/* Hero: Asymmetric Split */}
        <section
          id="hero"
          className="relative flex min-h-[100dvh] w-full min-w-0 overflow-hidden"
        >
          {/* Ambient decorative blobs */}
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            <div className="animate-breathe absolute -right-20 top-[8%] h-[32rem] w-[32rem] rounded-full bg-coral/[0.08] blur-3xl md:right-[-5%] md:h-[38rem] md:w-[38rem]" />
            <div className="absolute -bottom-24 left-[5%] h-[20rem] w-[20rem] rounded-full bg-blush/[0.12] blur-3xl sm:h-[28rem] sm:w-[28rem]" />
            <div className="animate-breathe absolute left-[30%] top-[40%] h-[16rem] w-[16rem] -translate-x-1/2 rounded-full bg-clay/[0.04] blur-3xl" style={{ animationDelay: "2s" }} />
          </div>

          {/* Content Grid: Left text / Right decorative */}
          <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-8 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-12">
            {/* Left: Text content */}
            <div className="flex flex-col">
              {/* Discipline tag */}
              <div className="animate-fade-in stagger-1 flex items-center gap-3">
                <span className="h-px w-8 bg-clay/40" />
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-clay sm:text-xs">
                  播音 · 表演 · 编导 · 美术
                </p>
              </div>

              {/* Main headline */}
              <h1 className="animate-fade-up stagger-2 mt-8 max-w-xl font-display text-display-xl font-bold tracking-tight text-stone-900">
                {siteName}
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-up stagger-3 mt-6 max-w-lg text-balance text-base leading-[1.8] text-stone-500 sm:mt-8 sm:text-lg">
                系统化教学、小班制辅导，助力考生科学规划考季、
                稳步提升专业与文化课成绩。
              </p>

              {/* Trust tags */}
              <div
                className="animate-fade-up stagger-4 mt-10 flex max-w-lg flex-wrap gap-2.5 sm:mt-12"
                aria-label="服务亮点"
              >
                {trustTags.map((tag, i) => (
                  <span
                    key={tag}
                    className="animate-fade-in inline-flex items-center rounded-full border border-stone-200/70 bg-white/60 px-3.5 py-1.5 text-[0.68rem] font-medium text-stone-600 backdrop-blur-sm sm:text-[0.75rem]"
                    style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="animate-fade-up stagger-5 mt-12 flex flex-wrap items-center gap-4 sm:mt-14">
                <Link
                  href="/contact"
                  className="tactile group inline-flex items-center justify-center rounded-full bg-clay px-8 py-3.5 text-sm font-semibold text-white shadow-warm transition-all hover:bg-clay-dark"
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
                  className="tactile inline-flex rounded-full border border-stone-200/80 bg-white/60 px-8 py-3.5 text-sm font-medium text-stone-700 backdrop-blur-sm transition-all hover:border-stone-300 hover:bg-white/80 hover:text-stone-900"
                >
                  了解特色
                </Link>
              </div>

              {/* Contact info */}
              {(phone || address) && (
                <dl className="animate-fade-up stagger-6 mt-16 flex flex-wrap gap-x-12 gap-y-6 border-t border-stone-200/50 pt-10 sm:mt-20 sm:pt-12">
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

            {/* Right: Decorative composition */}
            <div className="relative hidden lg:flex lg:items-center lg:justify-center" aria-hidden>
              <div className="relative h-[480px] w-full max-w-[440px]">
                {/* Floating geometric shapes */}
                <div className="animate-float absolute right-8 top-4 h-40 w-40 rounded-[2rem] bg-coral/[0.1] border border-coral/[0.06]" />
                <div className="animate-float absolute left-4 top-[30%] h-52 w-52 rounded-full bg-blush/[0.15] border border-blush/[0.08]" style={{ animationDelay: "1.5s" }} />
                <div className="animate-float absolute bottom-12 right-4 h-36 w-36 rounded-[2.5rem] bg-clay/[0.08] border border-clay/[0.05] rotate-12" style={{ animationDelay: "3s" }} />
                {/* Thin accent lines */}
                <div className="absolute left-[20%] top-0 h-full w-px bg-gradient-to-b from-transparent via-stone-200/40 to-transparent" />
                <div className="absolute top-[40%] left-0 h-px w-full bg-gradient-to-r from-transparent via-stone-200/30 to-transparent" />
                {/* Small accent dot */}
                <div className="animate-breathe absolute left-[45%] top-[55%] h-3 w-3 rounded-full bg-clay/30" />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-fade-in stagger-7">
            <div className="flex flex-col items-center gap-2 text-stone-300">
              <span className="text-[0.6rem] uppercase tracking-[0.25em] font-medium">Scroll</span>
              <span className="h-8 w-px bg-gradient-to-b from-stone-300 to-transparent" />
            </div>
          </div>
        </section>

        <SiteFooter siteName={siteName} icp={icp} />

        {apiError && (
          <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
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
