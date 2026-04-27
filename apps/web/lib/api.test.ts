import { afterEach, describe, expect, it } from "vitest";
import { getApiBase } from "./api";

describe("getApiBase", () => {
  const saved = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (saved === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = saved;
    }
  });

  it("returns default when env unset", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBase()).toBe("http://127.0.0.1:8000");
  });

  it("strips trailing slash", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://example.com:8000/";
    expect(getApiBase()).toBe("http://example.com:8000");
  });
});
