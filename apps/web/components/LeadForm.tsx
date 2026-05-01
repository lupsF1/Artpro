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
  "mt-2 w-full rounded-xl border border-stone-200/70 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm transition placeholder:text-stone-400 focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-40";

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
      className="animate-scale-in w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/80 p-8 font-sans shadow-premium backdrop-blur-sm sm:p-10"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgb(0 0 0 / 0.04), 0 12px 32px rgb(139 111 71 / 0.06)" }}
    >
      <div>
        <label className="text-[0.8rem] font-medium text-stone-500" htmlFor="lead-name">
          姓名
        </label>
        <input
          id="lead-name"
          className={inputClass}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="您的姓名"
          required
          minLength={1}
          maxLength={120}
          disabled={submitting}
        />
        <p className="mt-1.5 text-xs text-stone-400">请填写真实姓名，便于联系</p>
      </div>
      <div>
        <label className="text-[0.8rem] font-medium text-stone-500" htmlFor="lead-phone">
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
          placeholder="手机号码"
          required
          minLength={5}
          maxLength={32}
          disabled={submitting}
        />
        <p className="mt-1.5 text-xs text-stone-400">我们将在工作时间与您联系</p>
      </div>
      <div>
        <label className="text-[0.8rem] font-medium text-stone-500" htmlFor="lead-message">
          留言
        </label>
        <textarea
          id="lead-message"
          className={inputClass}
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="想了解的课程或问题（选填）"
          disabled={submitting}
        />
        <p className="mt-1.5 text-xs text-stone-400">可选填，帮助我们更好地准备</p>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="tactile w-full rounded-xl bg-clay py-3.5 text-sm font-semibold text-white shadow-warm transition-all hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            提交中
          </span>
        ) : (
          "提交"
        )}
      </button>
      {status === "ok" && (
        <p
          className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-800"
          role="status"
        >
          已提交，我们会尽快联系您。
        </p>
      )}
      {status === "err" && (
        <p
          className="rounded-xl border border-rose-200/60 bg-rose-50/80 px-3 py-2.5 text-sm text-rose-800"
          role="alert"
        >
          {errMsg}
        </p>
      )}
    </form>
  );
}
