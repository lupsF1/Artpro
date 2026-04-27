import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadForm } from "./LeadForm";

describe("LeadForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 0,
          message: "ok",
          data: { id: "x", name: "a", phone: "1" },
        }),
      }),
    );
  });

  it("POSTs to /api/v1/leads and shows success copy", async () => {
    const user = userEvent.setup();
    render(<LeadForm />);
    await user.type(screen.getByLabelText("姓名"), "张三");
    await user.type(screen.getByLabelText("手机"), "13800138000");
    await user.click(screen.getByRole("button", { name: "提交" }));

    const f = global.fetch as ReturnType<typeof vi.fn>;
    expect(f).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/leads",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(await screen.findByText(/已提交，我们会尽快联系您/)).toBeInTheDocument();
  });

  it("shows error when API returns non-zero code", async () => {
    const f = global.fetch as ReturnType<typeof vi.fn>;
    f.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 500001, message: "服务内部错误" }),
    });
    const user = userEvent.setup();
    render(<LeadForm />);
    await user.type(screen.getByLabelText("姓名"), "张三");
    await user.type(screen.getByLabelText("手机"), "13800138000");
    await user.click(screen.getByRole("button", { name: "提交" }));
    expect(await screen.findByText("服务内部错误")).toBeInTheDocument();
  });
});
