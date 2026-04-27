type Props = { siteName: string; icp: string | null };

export function SiteFooter({ siteName, icp }: Props) {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm text-neutral-600">
          © {new Date().getFullYear()} {siteName} · 专业艺考培训
        </p>
        {icp && (
          <p className="mt-1 text-xs text-neutral-500">{icp}</p>
        )}
      </div>
    </footer>
  );
}
