import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { advantageItems } from "@/lib/site-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "教学特色",
  description: "小班制分层、艺考规划、全真模考等教学体系介绍。",
};

export default function TeachingPage() {
  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 section-rhythm">
      <ArtAtmosphere variant="teaching" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        {/* 标题区 */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="font-display text-4xl font-bold leading-none text-stone-200 sm:text-5xl">
              01
            </span>
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-clay">
                <span className="inline-block h-px w-3 bg-clay/40" />
                教学体系
              </p>
              <h1 className="mt-1.5 font-display text-display-md font-bold text-stone-900">
                教学特色
              </h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-[1.8] text-stone-500 sm:mt-6 sm:text-base">
            以下为展示占位，可在 PRD 定稿后替换为真实师资、班型与成绩数据。
          </p>
        </div>

        {/* 卡片网格 */}
        <ul className="mt-14 grid grid-cols-1 gap-5 sm:mt-18 md:grid-cols-2 md:gap-6">
          {advantageItems.map((item, i) => (
            <li
              key={item.t}
              className={[
                "group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200/50 bg-white/80 p-7 shadow-soft backdrop-blur-sm transition duration-300 sm:p-8 md:p-9",
                "hover:-translate-y-0.5 hover:shadow-lift",
                i === 0 ? "md:row-span-2" : "",
              ].join(" ")}
            >
              <div className="mb-1 flex items-center gap-3">
                <span className="font-mono text-[0.62rem] font-medium tabular-nums text-clay/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-stone-200/60 to-transparent" />
              </div>

              <h2 className="mt-5 font-serif text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
                {item.t}
              </h2>
              <p className="mt-3 text-sm leading-[1.8] text-stone-500 sm:mt-3.5">
                {item.d}
              </p>

              {i === 0 && (
                <div className="mt-auto hidden pt-8 md:block" aria-hidden>
                  <div className="h-20 rounded-2xl bg-gradient-to-br from-coral/[0.08] to-blush/[0.06]" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}