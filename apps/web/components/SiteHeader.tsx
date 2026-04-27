import Link from "next/link";

type Props = { siteName: string };

const nav = [
  { href: "#advantages", label: "教学特色" },
  { href: "#news", label: "资讯" },
  { href: "#contact", label: "咨询" },
];

export function SiteHeader({ siteName }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-900 sm:text-base"
        >
          {siteName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-neutral-600 sm:flex" aria-label="主导航">
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
        <a
          href="#contact"
          className="shrink-0 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white sm:text-sm"
        >
          预约试听
        </a>
      </div>
    </header>
  );
}
