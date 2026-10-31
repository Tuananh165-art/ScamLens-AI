import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ExternalUrlCheck } from "./external-url-check";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
function openAndConsent() {
  fireEvent.click(screen.getByText("Tra cứu URL với Google Web Risk (tùy chọn)"));
  fireEvent.click(screen.getByRole("checkbox"));
}
it("drops a late result after editing the URL and requires consent again", async () => {
  let resolve!: (value: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(done => { resolve = done; })));
  render(<ExternalUrlCheck source="https://old.example/x" configured />);
  openAndConsent();
  fireEvent.click(screen.getByRole("button", { name: "Tra cứu URL" }));
  fireEvent.change(screen.getByLabelText("URL sẽ gửi"), { target: { value: "https://new.example/y" } });
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  await act(async () => resolve(new Response(JSON.stringify({ status: "matched", message: "Old result" }))));
  expect(screen.queryByText("Old result")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tra cứu URL" })).toBeDisabled();
});
it("marks an expired lookup and retains exactly the URL that was checked", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-31T10:00:00Z"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "not_listed", checkedAt: "2026-10-31T10:00:00Z", expiresAt: "2026-10-31T10:00:01Z", message: "Not listed", queriedUrl: "https://demo.example/x" }))));
  render(<ExternalUrlCheck source="https://demo.example/x" configured />);
  openAndConsent();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tra cứu URL" })); });
  expect(screen.getByText("Kết quả cho: https://demo.example/x")).toBeVisible();
  await act(async () => { vi.advanceTimersByTime(1100); });
  expect(screen.getByText(/Kết quả đã hết hạn/)).toBeVisible();
  expect(screen.queryByText("Not listed")).not.toBeInTheDocument();
});
