import { describe, expect, it } from "vitest";
import { parseJsonEnvelope } from "./parseJsonEnvelope";

describe("parseJsonEnvelope", () => {
  it("parses valid envelope", () => {
    const t = JSON.stringify({ code: 0, message: "ok", data: { a: 1 } });
    const e = parseJsonEnvelope<{ a: number }>(t, "t");
    expect(e.code).toBe(0);
    expect(e.data).toEqual({ a: 1 });
  });

  it("rejects empty body", () => {
    expect(() => parseJsonEnvelope("  ", "ctx")).toThrow(/响应体为空/);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseJsonEnvelope("not json", "ctx")).toThrow(/非合法 JSON/);
  });
});
