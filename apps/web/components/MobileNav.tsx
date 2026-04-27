"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type Item = { readonly href: string; readonly label: string };

type Props = {
  items: readonly Item[];
  className?: string;
  summary: ReactNode;
  panelClassName: string;
};

export function MobileNav({ items, className, summary, panelClassName }: Props) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
        const s = detailsRef.current.querySelector("summary");
        if (s instanceof HTMLElement) {
          s.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <details ref={detailsRef} className={className}>
      {summary}
      <div className={panelClassName}>
        <ul className="flex flex-col gap-0.5 text-sm" role="list">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  "block rounded-lg px-2.5 py-2.5 pl-2 text-[0.9rem] font-medium tracking-wide transition " +
                  (active
                    ? "border-l-2 border-amber-700/45 bg-amber-50/60 text-stone-900"
                    : "border-l-2 border-transparent text-stone-700 hover:border-stone-300/40 hover:bg-stone-50/90 hover:text-stone-900")
                }
                onClick={() => {
                  if (detailsRef.current) {
                    detailsRef.current.open = false;
                  }
                }}
              >
                {item.label}
              </Link>
            </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
