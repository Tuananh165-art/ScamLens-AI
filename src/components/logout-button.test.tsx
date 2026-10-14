import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LogoutButton } from "./logout-button";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("keeps a failed logout on the app and enables retry instead of navigating to JSON", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Chưa đăng xuất được." }) });
  vi.stubGlobal("fetch", fetcher);
  render(<LogoutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Chưa đăng xuất được.");
  expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeEnabled();
  expect(fetcher).toHaveBeenCalledWith("/auth/logout", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
});
