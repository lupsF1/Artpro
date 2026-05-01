import { LeadForm } from "@/components/LeadForm";
import { ArtAtmosphere } from "@/components/ArtAtmosphere";
import { fetchSiteConfig } from "@/lib/api-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "预约咨询",
  description: "留下联系方式，预约试听与课程咨询。",
};

export default async function ContactPage() {
  let phone: string | null = null;
  let address: string | null = null;

  try {
    const env = await fetchSiteConfig();
    if (env.code === 0 && env.data) {
      phone = env.data.phone;
      address = env.data.address;
    }
  } catch {
    /* 静默失败 */
  }

  return (
    <section className="relative w-full min-w-0 min-h-0 flex-1 section-rhythm">
      <ArtAtmosphere variant="contact" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Split: Left text / Right form */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* Left: Heading + context */}
          <div className="flex flex-col">
            <div className="flex items-end gap-4 sm:gap-5">
              <span className="font-display text-5xl font-bold leading-none text-stone-200/80 sm:text-6xl">
                03
              </span>
              <div>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-clay">
                  <span className="inline-block h-px w-3 bg-clay/40" />
                  预约
                </p>
                <h1
                  id="contact-heading"
                  className="mt-1.5 font-display text-display-md font-bold tracking-tight text-stone-900"
                >
                  预约咨询
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-sm text-sm leading-[1.8] text-stone-500 sm:mt-8 sm:text-base">
              留下联系方式，我们会尽快与您沟通试听与课程安排。
            </p>

            {/* Contact details */}
            {(phone || address) && (
              <dl className="mt-10 space-y-5 border-t border-stone-200/50 pt-8 sm:mt-12">
                {phone && (
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                      <span className="inline-block h-3.5 w-px bg-clay/30" />
                      咨询电话
                    </dt>
                    <dd className="mt-2.5 font-serif text-base font-medium tracking-tight text-stone-800 sm:text-lg">
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
                    <dd className="mt-2.5 text-sm leading-relaxed text-stone-600 sm:text-base">
                      {address}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {/* Decorative block */}
            <div className="mt-auto hidden pt-12 lg:block" aria-hidden>
              <div className="h-32 w-full max-w-[280px] rounded-[2rem] bg-gradient-to-br from-coral/[0.06] to-blush/[0.04] border border-coral/[0.04]" />
            </div>
          </div>

          {/* Right: Form */}
          <div className="flex items-start">
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
