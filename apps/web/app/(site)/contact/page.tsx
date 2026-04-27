import { LeadForm } from "@/components/LeadForm";
import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "预约咨询",
  description: "留下联系方式，预约试听与课程咨询。",
};

export default function ContactPage() {
  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 border-b border-stone-200/45 bg-gradient-to-b from-stone-50/70 via-amber-50/15 to-stone-100/55 py-24 backdrop-blur-[2px] sm:py-32">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-amber-100/15 via-transparent to-stone-50/20"
        aria-hidden
      />
      <ArtAtmosphere variant="contact" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
        <div className="flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-end sm:gap-8">
          <span className="font-serif text-4xl font-semibold leading-none text-stone-200 sm:text-5xl">
            03
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-stone-500">
              预约
            </p>
            <h1
              id="contact-heading"
              className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
            >
              预约咨询
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
              留下联系方式，我们会尽快与您沟通试听与课程安排。
            </p>
          </div>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}
