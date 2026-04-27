"use client";

import { useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type LeadResponse = { code: number; message: string; data?: unknown };

function parseLeadJson(text: string): LeadResponse {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("EMPTY_BODY");
  }
  return JSON.parse(trimmed) as LeadResponse;
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-stone-800 shadow-sm transition placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300/30 disabled:cursor-not-allowed disabled:bg-stone-50";

export function LeadForm() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setStatus("idle");
    setErrMsg("");
    try {
      const r = await fetch(`${getApiBase()}/api/v1/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message, source: "web" }),
      });
      const text = await r.text();
      let j: LeadResponse;
      try {
        j = parseLeadJson(text);
      } catch {
        setStatus("err");
        setErrMsg("服务器返回异常，请稍后再试");
        toast.error("服务器返回异常，请稍后再试");
        return;
      }
      if (!r.ok || j.code !== 0) {
        setStatus("err");
        const m = j.message || "提交失败";
        setErrMsg(m);
        toast.error(m);
        return;
      }
      setStatus("ok");
      toast.success("提交成功，我们会尽快联系您。");
      setName("");
      setPhone("");
      setMessage("");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      setStatus("err");
      setErrMsg("网络错误，请稍后再试");
      toast.error("网络错误，请稍后再试");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      id="contact-form"
      aria-labelledby="contact-heading"
      aria-busy={submitting}
      onSubmit={onSubmit}
      className="mt-10 max-w-md space-y-5 rounded-2xl border border-stone-200/80 bg-surface-card/80 p-7 font-sans shadow-soft backdrop-blur-sm sm:mt-12 sm:p-8"
    >
      <div>
        <label className="text-sm font-medium text-stone-600" htmlFor="lead-name">
          姓名
        </label>
        <input
          id="lead-name"
          className={inputClass}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={120}
          disabled={submitting}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-600" htmlFor="lead-phone">
          手机
        </label>
        <input
          id="lead-phone"
          className={inputClass}
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={5}
          maxLength={32}
          disabled={submitting}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-600" htmlFor="lead-message">
          留言
        </label>
        <textarea
          id="lead-message"
          className={inputClass}
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-stone-800 py-2.5 text-sm font-medium text-stone-50 shadow-soft transition hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "提交中…" : "提交"}
      </button>
      {status === "ok" && (
        <p
          className="rounded-xl border border-emerald-200/50 bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-900/90"
          role="status"
        >
          已提交，我们会尽快联系您。
        </p>
      )}
      {status === "err" && (
        <p
          className="rounded-xl border border-rose-200/50 bg-rose-50/80 px-3 py-2.5 text-sm text-rose-900/90"
          role="alert"
        >
          {errMsg}
        </p>
      )}
    </form>
  );
}
