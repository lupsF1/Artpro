import Link from "next/link";

type Props = { siteName: string };

const nav = [
  { href: "#advantages", label: "教学特色" },
  { href: "#news", label: "资讯" },
  { href: "#contact", label: "咨询" },
] as const;

export function SiteHeader({ siteName }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-tight text-neutral-900 sm:text-base"
        >
          {siteName}
        </Link>
        <nav
          className="hidden flex-1 items-center justify-center gap-6 text-sm text-neutral-600 sm:flex"
          aria-label="主导航"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-neutral-900"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <details className="relative sm:hidden">
            <summary
              className="list-none cursor-pointer rounded border border-neutral-300 bg-white px-2.5 py-1 text-sm text-neutral-800 hover:bg-neutral-50 [&::-webkit-details-marker]:hidden"
              aria-label="打开导航菜单"
            >
              导航
            </summary>
            <div className="absolute right-0 z-30 mt-1 min-w-40 rounded-md border border-neutral-200 bg-white p-2 shadow-md">
              <ul className="flex flex-col gap-0.5 text-sm text-neutral-700" role="list">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block rounded px-2 py-2 hover:bg-neutral-100"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </details>
          <a
            href="#contact"
            className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white sm:text-sm"
          >
            预约试听
          </a>
        </div>
      </div>
    </header>
  );
}
