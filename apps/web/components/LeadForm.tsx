"use client";

import { useState } from "react";
import { getApiBase } from "@/lib/api";

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
      const j = (await r.json()) as { code: number; message: string };
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
      onSubmit={onSubmit}
      className="mt-6 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-medium">预约咨询</h2>
      <div>
        <label className="text-sm text-neutral-600" htmlFor="name">
          姓名
        </label>
        <input
          id="name"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={120}
        />
      </div>
      <div>
        <label className="text-sm text-neutral-600" htmlFor="phone">
          手机
        </label>
        <input
          id="phone"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={5}
          maxLength={32}
        />
      </div>
      <div>
        <label className="text-sm text-neutral-600" htmlFor="message">
          留言
        </label>
        <textarea
          id="message"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
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
        <p className="text-sm text-green-700">已提交，我们会尽快联系您。</p>
      )}
      {status === "err" && <p className="text-sm text-red-600">{errMsg}</p>}
    </form>
  );
}
