"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setAdminToken } from "@/lib/adminApi";
import { useToast } from "@/components/ToastProvider";

const items = [
  { href: "/admin/leads", label: "线索" },
  { href: "/admin/site", label: "站点" },
  { href: "/admin/articles", label: "文章" },
] as const;

export function AdminNav() {
  const toast = useToast();
  const path = usePathname();
  return (
    <aside className="shrink-0 border-b border-stone-200/80 bg-white/60 px-4 py-4 sm:w-48 sm:border-b-0 sm:border-r">
      <p className="px-1 font-serif text-sm font-semibold text-stone-800">管理</p>
      <nav className="mt-3 flex flex-wrap gap-1 sm:mt-4 sm:flex-col">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-stone-200/80 font-medium text-stone-900"
                  : "text-stone-600 hover:bg-stone-100",
              ].join(" ")}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-stone-200/80 bg-transparent px-3 py-2 text-left text-xs text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
        onClick={() => {
          setAdminToken(null);
          toast.success("已退出登录");
          window.setTimeout(() => {
            window.location.href = "/admin/login";
          }, 200);
        }}
      >
        退出登录
      </button>
    </aside>
  );
}
