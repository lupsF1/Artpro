"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ADMIN_TOAST_EVENT } from "@/lib/adminApi";

type Variant = "success" | "error";

export type ToastItem = { id: string; variant: Variant; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const v = useContext(ToastContext);
  if (!v) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return v;
}

/** 无 Provider 时静默 no-op，避免误用崩溃 */
export function useToastOptional(): ToastApi | null {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((variant: Variant, message: string) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    setItems((prev) => [...prev, { id, variant, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
    }),
    [push],
  );

  useEffect(() => {
    const onExt = (e: Event) => {
      const d = (e as CustomEvent<{ variant: Variant; message: string }>).detail;
      if (!d?.message) return;
      if (d.variant === "success") {
        push("success", d.message);
      } else {
        push("error", d.message);
      }
    };
    window.addEventListener(ADMIN_TOAST_EVENT, onExt);
    return () => window.removeEventListener(ADMIN_TOAST_EVENT, onExt);
  }, [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-1/2 z-[200] flex -translate-y-1/2 flex-col items-center gap-3 px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              t.variant === "success"
                ? "pointer-events-auto w-full max-w-md rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-4 py-3 text-center text-sm text-emerald-900 shadow-lg backdrop-blur"
                : "pointer-events-auto w-full max-w-md rounded-xl border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-center text-sm text-rose-900 shadow-lg backdrop-blur"
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
