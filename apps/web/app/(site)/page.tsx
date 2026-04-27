import {
  CornerFrameLines,
  HeroLineAccents,
  SectionHairline,
} from "@/components/LineDecor";
import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { fetchSiteConfig } from "@/lib/api-server";
import { trustTags } from "@/lib/site-content";
import Link from "next/link";

export default async function HomePage() {
  let siteName = "丝育教育";
  let phone: string | null = null;
  let address: string | null = null;
  let apiError: string | null = null;

  try {
    const env = await fetchSiteConfig();
    if (env.code === 0 && env.data) {
      siteName = env.data.siteName;
      phone = env.data.phone;
      address = env.data.address;
    }
  } catch (e) {
    apiError = e instanceof Error ? e.message : "无法连接 API";
  }

  return (
    <>
      <div className="flex w-full min-w-0 flex-1 flex-col">
        <section
          id="hero"
          className="relative flex min-h-0 w-full min-w-0 flex-1 overflow-hidden border-b border-stone-200/45 bg-gradient-to-b from-stone-50/40 via-white/15 to-stone-100/35"
        >
          <ArtAtmosphere variant="home" />
          <div
            className="pointer-events-none absolute inset-0 bg-grid-fine opacity-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-radial-soft"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-hero-ambient"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-[22rem] w-[22rem] rounded-full bg-amber-200/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-[6%] h-80 w-80 rounded-full bg-orange-100/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[42%] top-[38%] h-72 w-72 -translate-x-1/2 rounded-full bg-stone-100/45 blur-3xl"
            aria-hidden
          />
          <p
            className="pointer-events-none absolute -left-2 top-16 hidden max-w-[min(72vw,18rem)] select-none font-serif text-[clamp(3.25rem,15vw,10rem)] font-semibold leading-none tracking-tight text-stone-200/30 [text-shadow:0_1px_0_rgb(255_255_255/0.25)] md:left-0 md:top-20 md:max-w-none md:text-[clamp(4rem,18vw,12rem)] md:text-stone-200/32"
            aria-hidden
          >
            丝育
          </p>
          <HeroLineAccents />

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-28 sm:px-8 sm:py-36 lg:px-10">
            <CornerFrameLines />
            <p className="animate-fade-in text-[0.7rem] font-medium uppercase tracking-[0.25em] text-stone-500 sm:pt-1 sm:text-xs">
              播音 · 表演 · 编导 · 美术
            </p>
            <h1 className="animate-fade-up mt-6 max-w-3xl font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-balance text-stone-900 [text-shadow:0_1px_32px_rgb(255_255_255/0.5)] sm:mt-8">
              {siteName}
            </h1>
            <p className="animate-fade-up mt-7 max-w-xl text-balance text-base leading-relaxed text-stone-600 [animation-delay:0.08s] sm:mt-8 sm:text-lg">
              系统化教学、小班制辅导，助力考生科学规划考季、稳步提升专业与文化课成绩。
            </p>

            <div
              className="animate-fade-up mt-9 flex max-w-2xl flex-wrap gap-3 [animation-delay:0.12s] sm:mt-10"
              aria-label="服务亮点"
            >
              {trustTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-stone-200/90 bg-white/60 px-3 py-1 text-[0.7rem] font-medium text-stone-600 shadow-sm backdrop-blur sm:text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="animate-fade-up mt-12 flex flex-wrap items-center gap-4 [animation-delay:0.15s] sm:mt-14">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center rounded-full bg-stone-800 px-7 py-2.5 text-sm font-medium text-stone-50 shadow-glow transition hover:bg-stone-900"
              >
                预约咨询
                <span
                  className="ml-1 inline-block transition group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </Link>
              <Link
                href="/teaching"
                className="inline-flex rounded-full border border-stone-200/90 bg-white/85 px-7 py-2.5 text-sm font-medium text-stone-800 shadow-sm backdrop-blur transition hover:border-stone-300 hover:bg-white"
              >
                了解特色
              </Link>
            </div>

            {(phone || address) && (
              <dl className="animate-fade-up mt-20 grid gap-6 border-t border-stone-200/50 pt-12 text-sm text-stone-600 sm:grid-cols-2 [animation-delay:0.18s]">
                {phone && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">
                      咨询电话
                    </dt>
                    <dd className="mt-1.5 font-medium text-stone-800">
                      {phone}
                    </dd>
                  </div>
                )}
                {address && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">
                      校区地址
                    </dt>
                    <dd className="mt-1.5 leading-relaxed text-stone-800">
                      {address}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </section>
        <SectionHairline variant="art" />
        {apiError && (
          <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <p className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-5 py-4 text-sm leading-relaxed text-amber-950/80 backdrop-blur">
              无法连接后端 API（{apiError}）。站点名等将使用默认文案；请确认已启动{" "}
              <code className="rounded-md bg-white/60 px-1.5 py-0.5 text-amber-950/90">
                apps/api
              </code>{" "}
              与{" "}
              <code className="rounded-md bg-white/60 px-1.5 py-0.5 text-amber-950/90">
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
