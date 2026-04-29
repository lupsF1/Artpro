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
            className={`relative px-3 py-2 text-[0.8rem] font-medium tracking-[0.04em] transition sm:px-3.5 sm:text-[0.825rem] ${
              active
                ? "text-stone-900"
                : "text-stone-500 hover:text-stone-800"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
            <span
              className={`absolute inset-x-3 bottom-0 h-[2px] rounded-full transition-all duration-300 ${
                active
                  ? "bg-clay opacity-100"
                  : "bg-transparent opacity-0"
              }`}
              aria-hidden
            />
          </Link>
        );
      })}
    </>
  );
}