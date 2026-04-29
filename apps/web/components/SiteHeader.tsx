"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";
import { mainNav } from "@/lib/site-nav";

type Props = { siteName: string };

export function SiteHeader({ siteName }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 font-sans transition-all duration-500 ${
        scrolled
          ? "border-b border-stone-200/60 bg-cream/90 backdrop-blur-xl shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          href="/"
          className="group shrink-0 flex items-center gap-2.5 transition hover:opacity-80"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clay text-[0.55rem] font-bold leading-none text-white sm:h-9 sm:w-9 sm:text-[0.6rem]">
            丝育
          </span>
          <span className="font-serif text-[0.95rem] font-semibold tracking-tight text-stone-900 sm:text-lg">
            {siteName}
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 sm:flex"
          aria-label="主导航"
        >
          <NavLinks items={mainNav} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <MobileNav
            items={mainNav}
            className="relative sm:hidden"
            panelClassName="absolute right-0 z-30 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 p-1.5 shadow-lift backdrop-blur-xl"
            summary={
              <summary className="list-none cursor-pointer rounded-lg border border-stone-200/80 bg-white/80 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
                导航
              </summary>
            }
          />
          <Link
            href="/contact"
            className="rounded-full bg-clay px-5 py-2 text-xs font-semibold text-white shadow-warm transition-all hover:bg-clay-dark sm:text-[0.8rem] sm:tracking-wide"
          >
            预约咨询
          </Link>
        </div>
      </div>
    </header>
  );
}