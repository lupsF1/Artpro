"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { readonly href: string; readonly label: string };

export function NavLinks({ items }: { items: readonly Item[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2.5 py-1.5 text-[0.7rem] font-medium tracking-[0.1em] antialiased transition sm:px-3 sm:text-[0.8125rem] sm:tracking-[0.12em] ${
              active
                ? "border-b-2 border-amber-700/65 pb-0.5 text-stone-900"
                : "border-b-2 border-transparent pb-0.5 text-stone-500 hover:border-stone-300/60 hover:text-stone-800"
            } `}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
