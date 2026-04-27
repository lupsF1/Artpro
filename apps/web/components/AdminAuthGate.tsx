"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { emitAdminToast, getAdminToken } from "@/lib/adminApi";

const PUBLIC_PREFIX = "/admin/login";

type Props = { children: React.ReactNode };

/**
 * 除登录页外，无 token 时重定向到 /admin/login?next=...
 */
export function AdminAuthGate({ children }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!path) return;
    if (path === PUBLIC_PREFIX || path.startsWith(`${PUBLIC_PREFIX}/`)) {
      setOk(true);
      return;
    }
    if (!getAdminToken()) {
      const next = `${path}${window.location.search || ""}`;
      emitAdminToast("error", "请先登录");
      router.replace(
        `/admin/login?next=${encodeURIComponent(next)}`,
      );
      setOk(false);
      return;
    }
    setOk(true);
  }, [path, router]);

  if (ok === null || ok === false) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-stone-500">
        检查登录状态…
      </div>
    );
  }
  return <>{children}</>;
}
