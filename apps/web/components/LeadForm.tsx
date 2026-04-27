"use client";

import { useState } from "react";
import { getApiBase } from "@/lib/api";

type LeadResponse = { code: number; message: string; data?: unknown };

function parseLeadJson(text: string): LeadResponse {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("EMPTY_BODY");
  }
  return JSON.parse(trimmed) as LeadResponse;
}

export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        return;
      }
      if (!r.ok || j.code !== 0) {
        setStatus("err");
        setErrMsg(j.message || "提交失败");
        return;
      }
      setStatus("ok");
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("err");
      setErrMsg("网络错误，请稍后再试");
    }
  }

  return (
    <form
      id="contact-form"
      aria-labelledby="contact-heading"
      onSubmit={onSubmit}
      className="mt-6 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <div>
        <label className="text-sm text-neutral-600" htmlFor="lead-name">
          姓名
        </label>
        <input
          id="lead-name"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={120}
        />
      </div>
      <div>
        <label className="text-sm text-neutral-600" htmlFor="lead-phone">
          手机
        </label>
        <input
          id="lead-phone"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={5}
          maxLength={32}
        />
      </div>
      <div>
        <label className="text-sm text-neutral-600" htmlFor="lead-message">
          留言
        </label>
        <textarea
          id="lead-message"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        提交
      </button>
      {status === "ok" && (
        <p className="text-sm text-green-700" role="status">
          已提交，我们会尽快联系您。
        </p>
      )}
      {status === "err" && (
        <p className="text-sm text-red-600" role="alert">
          {errMsg}
        </p>
      )}
    </form>
  );
}
