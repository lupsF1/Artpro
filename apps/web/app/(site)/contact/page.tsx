import { LeadForm } from "@/components/LeadForm";
import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "预约咨询",
  description: "留下联系方式，预约试听与课程咨询。",
};

export default function ContactPage() {
  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 section-rhythm">
      <ArtAtmosphere variant="contact" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
          <span className="shrink-0 font-display text-4xl font-bold leading-none text-stone-200 sm:text-5xl">
            03
          </span>
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-clay">
              <span className="inline-block h-px w-3 bg-clay/40" />
              预约
            </p>
            <h1
              id="contact-heading"
              className="mt-1.5 font-display text-display-md font-bold text-stone-900"
            >
              预约咨询
            </h1>
            <p className="mt-4 text-sm leading-[1.8] text-stone-500 sm:mt-5 sm:text-base">
              留下联系方式，我们会尽快与您沟通试听与课程安排。
            </p>
          </div>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}