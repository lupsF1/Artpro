"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isLogin = path === "/admin/login";
  if (isLogin) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col sm:flex-row">
      <AdminNav />
      <main className="min-h-dvh min-w-0 flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}
