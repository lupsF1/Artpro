/**
 * 艺考咨询助手：匿名 SSE（POST /api/v1/assistant/chat）
 */
import { getApiBase } from "./api";

export type AssistantCitation = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  score: number;
  preview: string;
  meta?: Record<string, unknown>;
};

export type AssistantStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; citations?: AssistantCitation[] }
  | { type: "error"; code: number; message: string };

function flushSseBuffer(
  buffer: string,
): { rest: string; events: AssistantStreamEvent[] } {
  const events: AssistantStreamEvent[] = [];
  let rest = buffer;
  while (true) {
    const idx = rest.indexOf("\n\n");
    if (idx === -1) break;
    const block = rest.slice(0, idx).replace(/\r/g, "");
    rest = rest.slice(idx + 2);
    const line = block.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as AssistantStreamEvent);
    } catch {
      /* 忽略畸形帧 */
    }
  }
  return { rest, events };
}

function apiUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function consultAssistantStream(
  messages: { role: "user" | "assistant"; content: string }[],
  handlers: {
    onDelta: (text: string) => void;
    onDone: (citations: AssistantCitation[]) => void;
  },
): Promise<void> {
  const r = await fetch(apiUrl("/api/v1/assistant/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages }),
  });

  const ct = r.headers.get("content-type") ?? "";

  if (!ct.includes("text/event-stream")) {
    try {
      const j = (await r.json()) as { code?: number; message?: string };
      if (!r.ok || (j.code !== undefined && j.code !== 0)) {
        throw new Error(j?.message || r.statusText || "咨询助手暂不可用");
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(r.statusText || "咨询助手暂不可用");
    }
    throw new Error("未收到流式响应");
  }

  if (!r.ok || !r.body) {
    throw new Error(r.statusText || "咨询助手暂不可用");
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buf += decoder.decode(value, { stream: true });
    }
    const { rest, events } = flushSseBuffer(buf);
    buf = rest;
    for (const ev of events) {
      if (ev.type === "delta" && typeof ev.text === "string") {
        handlers.onDelta(ev.text);
      } else if (ev.type === "done") {
        handlers.onDone(ev.citations ?? []);
        await reader.cancel().catch(() => {});
        return;
      } else if (ev.type === "error") {
        await reader.cancel().catch(() => {});
        throw new Error(ev.message ?? "生成失败");
      }
    }
    if (done) {
      const { events: finalEvents } = flushSseBuffer(buf + decoder.decode());
      for (const ev of finalEvents) {
        if (ev.type === "delta" && typeof ev.text === "string") {
          handlers.onDelta(ev.text);
        } else if (ev.type === "done") {
          handlers.onDone(ev.citations ?? []);
          return;
        } else if (ev.type === "error") {
          throw new Error(ev.message ?? "生成失败");
        }
      }
      throw new Error("流已结束但未收到完成帧");
    }
  }
}
