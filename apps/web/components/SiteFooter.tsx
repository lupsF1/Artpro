import Link from "next/link";
import { mainNav } from "@/lib/site-nav";

type Props = { siteName: string; icp: string | null };

export function SiteFooter({ siteName, icp }: Props) {
  return (
    <footer className="mt-auto border-t border-stone-200/60 bg-sand font-sans">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        {/* Asymmetric grid: brand wider than nav/contact */}
        <div className="grid gap-10 sm:grid-cols-[1.4fr_0.8fr_0.8fr] sm:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clay text-[0.55rem] font-bold leading-none text-white sm:h-9 sm:w-9 sm:text-[0.6rem]">
                丝育
              </span>
              <span className="font-serif text-base font-semibold tracking-tight text-stone-900">
                {siteName}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-500">
              专注艺考培训，以系统化教学与小班制辅导助力考生稳步提升。
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="页脚导航">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              导航
            </p>
            <ul className="mt-4 space-y-2.5">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-stone-600 transition hover:text-clay"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact CTA */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              联系
            </p>
            <p className="mt-4 text-sm text-stone-500">
              预约咨询，开启艺考之路
            </p>
            <Link
              href="/contact"
              className="tactile mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-clay transition hover:text-clay-dark"
            >
              立即预约 <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 h-px bg-gradient-to-r from-transparent via-stone-300/40 to-transparent" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-stone-600">{siteName}</span>
          </p>
          {icp && <p className="text-xs text-stone-400">{icp}</p>}
        </div>
      </div>
    </footer>
  );
}
