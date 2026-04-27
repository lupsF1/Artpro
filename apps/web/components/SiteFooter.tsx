type Props = { siteName: string; icp: string | null };

export function SiteFooter({ siteName, icp }: Props) {
  return (
    <footer className="mt-auto border-t border-stone-200/45 bg-gradient-to-b from-white/45 to-stone-100/50 font-sans backdrop-blur-[2px]">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-sm text-stone-600">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-stone-800">{siteName}</span> ·
          专业艺考培训
        </p>
        {icp && <p className="mt-2 text-xs text-stone-500">{icp}</p>}
      </div>
    </footer>
  );
}
