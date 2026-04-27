import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { advantageItems } from "@/lib/site-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "教学特色",
  description: "小班制分层、艺考规划、全真模考等教学体系介绍。",
};

export default function TeachingPage() {
  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 border-b border-stone-200/45 bg-stone-50/75 py-24 backdrop-blur-[2px] sm:py-32">
      <ArtAtmosphere variant="teaching" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 sm:gap-5">
              <span className="font-serif text-4xl font-semibold leading-none text-stone-200 sm:text-5xl">
                01
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-stone-500">
                  教学体系
                </p>
                <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  教学特色
                </h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:mt-5 sm:text-base">
              以下为展示占位，可在 PRD 定稿后替换为真实师资、班型与成绩数据。
            </p>
          </div>

          <ul className="mt-14 grid grid-cols-1 gap-6 sm:mt-20 md:grid-cols-2 md:grid-rows-2 md:gap-7">
            {advantageItems.map((item, i) => (
              <li
                key={item.t}
                className={[
                  "group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-surface-card/90 p-7 shadow-soft transition duration-300 sm:p-8 md:p-9",
                  "hover:-translate-y-0.5 hover:border-stone-300/90 hover:shadow-lift",
                  i === 0 ? "md:row-span-2" : "",
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-[0.65rem] font-medium tabular-nums text-stone-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
                </div>
                <h2 className="mt-4 font-serif text-lg font-semibold text-stone-900 sm:text-xl">
                  {item.t}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-stone-600 sm:mt-3">
                  {item.d}
                </p>
                {i === 0 && (
                  <div className="mt-auto hidden pt-8 md:block" aria-hidden>
                    <div className="h-20 rounded-xl bg-gradient-to-br from-stone-100/80 to-stone-50/30 ring-1 ring-inset ring-stone-200/50" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
    </section>
  );
}
