"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { consultAssistantStream } from "@/lib/consultStream";

type ChatMsg = { role: "user" | "assistant"; content: string };

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-stone max-w-none text-sm leading-relaxed prose-headings:mb-1.5 prose-headings:mt-3 prose-headings:font-serif prose-headings:font-semibold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-stone-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

export function ConsultAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    const nextHistory: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setStreaming(true);

    let assistantAccum = "";
    setMessages([...nextHistory, { role: "assistant", content: "" }]);

    try {
      await consultAssistantStream(
        nextHistory,
        {
          onDelta: (t) => {
            assistantAccum += t;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistantAccum,
                };
              }
              return copy;
            });
            scrollToEnd();
          },
          onDone: () => {},
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "发送失败";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      scrollToEnd();
    }
  };

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="consult-assistant-panel"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white shadow-warm transition hover:bg-clay-dark sm:bottom-8 sm:right-8"
      >
        咨询
      </button>

      {open ? (
        <div
          id="consult-assistant-panel"
          className="fixed inset-x-3 bottom-24 z-40 flex max-h-[min(520px,70dvh)] flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-cream/95 shadow-lift sm:inset-x-auto sm:right-8 sm:w-[400px]"
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div className="border-b border-stone-200/60 px-4 py-3">
            <p className="font-serif text-sm font-semibold text-stone-900">
              艺考咨询助手
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              回答依据站内知识库，不作为招生承诺；分数线与政策以官方或老师说明为准。
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <p className="text-sm text-stone-500">
                您好，可以问课程、备考规划或集训安排等。涉及个人择校与录取细节建议预约面谈。
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={
                    m.role === "user"
                      ? "ml-6 rounded-xl bg-stone-200/60 px-3 py-2 text-sm text-stone-800"
                      : "mr-4 rounded-xl border border-stone-200/70 bg-white/70 px-3 py-2 text-stone-700"
                  }
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <AssistantMarkdown content={m.content} />
                    ) : streaming ? (
                      <span className="text-sm text-stone-500">…</span>
                    ) : null
                  ) : (
                    m.content
                  )}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          {error ? (
            <p className="border-t border-red-200/50 bg-red-50/80 px-3 py-2 text-xs text-red-800">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2 border-t border-stone-200/60 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="输入问题…"
              disabled={streaming}
              className="min-w-0 flex-1 rounded-xl border border-stone-200/80 bg-white/80 px-3 py-2 text-sm text-stone-800 outline-none ring-clay/30 placeholder:text-stone-400 focus:ring-2"
            />
            <button
              type="button"
              disabled={streaming || !input.trim()}
              onClick={() => void send()}
              className="shrink-0 rounded-xl bg-clay px-4 py-2 text-xs font-semibold text-white transition hover:bg-clay-dark disabled:opacity-50"
            >
              发送
            </button>
          </div>
          <div className="border-t border-stone-200/50 px-3 pb-3 pt-2 text-center">
            <Link
              href="/contact"
              className="text-[11px] font-medium text-clay hover:underline"
            >
              预约咨询（留资）
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
