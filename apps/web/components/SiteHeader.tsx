import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";
import { mainNav } from "@/lib/site-nav";

type Props = { siteName: string };

export function SiteHeader({ siteName }: Props) {
  return (
    <header className="relative sticky top-0 z-20 border-b border-stone-200/40 bg-white/70 font-sans shadow-[inset_0_-1px_0_0_rgb(0_0_0/0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
      <div className="relative mx-auto flex h-[3.65rem] max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="group shrink-0 border-l-[3px] border-amber-700/35 pl-2.5 font-serif text-[0.98rem] font-semibold leading-tight tracking-tight text-stone-900 transition hover:border-amber-700/55 hover:text-stone-800 sm:border-l-4 sm:pl-3 sm:text-lg"
        >
          {siteName}
        </Link>
        <nav
          className="hidden flex-1 items-center justify-center gap-1 sm:flex"
          aria-label="主导航"
        >
          <NavLinks items={mainNav} />
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <MobileNav
            items={mainNav}
            className="relative sm:hidden"
            panelClassName="absolute right-0 z-30 mt-1.5 min-w-[10.5rem] overflow-hidden rounded-xl border border-stone-200/80 bg-white/95 p-1.5 shadow-lift backdrop-blur-md"
            summary={
              <summary
                className="list-none cursor-pointer rounded-full border border-stone-200/90 bg-stone-50/80 px-3 py-1.5 text-sm text-stone-800 transition hover:bg-stone-100/90 [&::-webkit-details-marker]:hidden"
                aria-label="打开导航菜单"
              >
                导航
              </summary>
            }
          />
          <Link
            href="/contact"
            className="rounded-full bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-50 shadow-glow ring-1 ring-stone-900/10 transition hover:bg-stone-800 hover:ring-amber-800/20 sm:px-4 sm:text-[0.8125rem] sm:tracking-wide"
          >
            预约试听
          </Link>
        </div>
      </div>
    </header>
  );
}
