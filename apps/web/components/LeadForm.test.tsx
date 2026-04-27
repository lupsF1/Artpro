import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadForm } from "./LeadForm";
import { ToastProvider } from "./ToastProvider";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function mockResponse(body: object, ok = true) {
  const s = JSON.stringify(body);
  return {
    ok,
    text: async () => s,
    json: async () => JSON.parse(s),
  };
}

describe("LeadForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          code: 0,
          message: "ok",
          data: { id: "x", name: "a", phone: "1" },
        }),
      ),
    );
  });

  it("POSTs to /api/v1/leads and shows success copy", async () => {
    const user = userEvent.setup();
    renderWithToast(<LeadForm />);
    await user.type(screen.getByLabelText("姓名"), "张三");
    await user.type(screen.getByLabelText("手机"), "13800138000");
    await user.click(screen.getByRole("button", { name: /提交/ }));

    const f = global.fetch as ReturnType<typeof vi.fn>;
    expect(f).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/leads",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(
      await screen.findByText("已提交，我们会尽快联系您。"),
    ).toBeInTheDocument();
  });

  it("disables controls and only sends one request when a second submit is attempted while in flight", async () => {
    let resolveReq: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveReq = r;
    });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithToast(<LeadForm />);
    await user.type(screen.getByLabelText("姓名"), "李四");
    await user.type(screen.getByLabelText("手机"), "13900139000");
    const btn = screen.getByRole("button", { name: /提交/ });
    await user.click(btn);
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveReq!(
      mockResponse({
        code: 0,
        message: "ok",
        data: { id: "y", name: "李四", phone: "13900139000" },
      }),
    );
    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows error when API returns non-zero code", async () => {
    const f = global.fetch as ReturnType<typeof vi.fn>;
    f.mockResolvedValueOnce(
      mockResponse({ code: 500001, message: "服务内部错误" }),
    );
    const user = userEvent.setup();
    renderWithToast(<LeadForm />);
    await user.type(screen.getByLabelText("姓名"), "张三");
    await user.type(screen.getByLabelText("手机"), "13800138000");
    await user.click(screen.getByRole("button", { name: /提交/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("服务内部错误");
  });
});
