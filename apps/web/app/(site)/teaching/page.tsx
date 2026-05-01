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
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Header: Left-aligned with large number */}
        <div className="max-w-2xl">
          <div className="flex items-end gap-4 sm:gap-5">
            <span className="font-display text-5xl font-bold leading-none text-stone-200/80 sm:text-6xl">
              01
            </span>
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-clay">
                <span className="inline-block h-px w-3 bg-clay/40" />
                教学体系
              </p>
              <h1 className="mt-1.5 font-display text-display-md font-bold tracking-tight text-stone-900">
                教学特色
              </h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-[1.8] text-stone-500 sm:mt-6 sm:text-base">
            以下为展示占位，可在 PRD 定稿后替换为真实师资、班型与成绩数据。
          </p>
        </div>

        {/* Zigzag feature rows */}
        <div className="mt-16 space-y-8 sm:mt-20 sm:space-y-12">
          {advantageItems.map((item, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={item.t}
                className={`animate-fade-up group relative flex flex-col gap-6 rounded-3xl border border-stone-200/50 bg-white/70 p-7 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-10 md:flex-row md:items-center md:gap-10 ${
                  isEven ? "" : "md:flex-row-reverse"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Number + visual block */}
                <div className="flex shrink-0 flex-col items-start gap-4 md:w-48">
                  <span className="font-mono text-[0.62rem] font-medium tabular-nums text-clay/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`h-24 w-full rounded-2xl md:h-32 ${
                      i === 0
                        ? "bg-gradient-to-br from-coral/[0.1] to-blush/[0.06]"
                        : i === 1
                          ? "bg-gradient-to-br from-clay/[0.08] to-coral/[0.05]"
                          : "bg-gradient-to-br from-blush/[0.1] to-clay/[0.06]"
                    }`}
                    aria-hidden
                  />
                </div>

                {/* Text content */}
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                    {item.t}
                  </h2>
                  <div className="mt-3 h-px w-12 bg-clay/20" />
                  <p className="mt-4 max-w-md text-sm leading-[1.8] text-stone-500 sm:text-base">
                    {item.d}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
