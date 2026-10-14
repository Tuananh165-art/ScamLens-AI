import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getAuthenticatedUser: mocks.auth }));
import HomePage from "./page";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("shows the authenticated email and discards account A's form when identity changes to B", async () => {
  mocks.auth.mockResolvedValue({ configured: true, user: { id: "a", email: "a@example.test" } });
  const view = render(await HomePage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByText("a@example.test")).toBeVisible();
  fireEvent.change(screen.getByLabelText(/Nội dung tin nhắn/), { target: { value: "Private account A draft" } });
  mocks.auth.mockResolvedValue({ configured: true, user: { id: "b", email: "b@example.test" } });
  view.rerender(await HomePage({ searchParams: Promise.resolve({}) }));
  expect(screen.queryByText("a@example.test")).not.toBeInTheDocument();
  expect(screen.getByText("b@example.test")).toBeVisible();
  expect(screen.getByLabelText(/Nội dung tin nhắn/)).toHaveValue("");
});
it("shows a failed OAuth callback explicitly", async () => {
  mocks.auth.mockResolvedValue({ configured: true, user: null });
  render(await HomePage({ searchParams: Promise.resolve({ auth: "error" }) }));
  expect(screen.getByRole("alert")).toHaveTextContent("Chưa hoàn tất đăng nhập Google");
});
