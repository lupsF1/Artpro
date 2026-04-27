import { beforeEach, describe, expect, it, vi } from "vitest";

describe("api-server", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("fetchSiteConfig parses JSON envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            code: 0,
            message: "ok",
            data: {
              siteName: "TestSite",
              phone: null,
              address: null,
              icp: null,
            },
          }),
      }),
    );
    const { fetchSiteConfig } = await import("./api-server");
    const env = await fetchSiteConfig();
    expect(env.data?.siteName).toBe("TestSite");
  });

  it("fetchSiteConfig throws on invalid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "not-json",
      }),
    );
    const { fetchSiteConfig } = await import("./api-server");
    await expect(fetchSiteConfig()).rejects.toThrow(/非合法 JSON/);
  });

  it("fetchArticleList requests with page and pageSize", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: 0,
          message: "ok",
          data: { items: [], meta: { page: 1, pageSize: 3, total: 0 } },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchArticleList } = await import("./api-server");
    await fetchArticleList(1, 3);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/page=1&pageSize=3$/),
      expect.any(Object),
    );
  });
});
