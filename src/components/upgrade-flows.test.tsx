import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { HomeApp } from "./home-app";
import { ResponseActions } from "./response-actions";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
const props = { signedIn: false, email: null, avatarUrl: null, authConfigured: false };
function report(summary: string) {
  return { schemaVersion: "1.0", id: "f37d0b8c-54f3-4e23-9181-ef9ece55b0b4", createdAt: "2026-10-31T10:00:00Z", type: "message", riskLevel: "insufficient", summary, findings: [], localFindings: [], aiFindings: [], checklist: [], limitations: [], source: { id: "s1", content: summary, confirmedOcr: false }, model: { text: "fixture" } };
}
it("sends the complete edited email preview and masks secrets added to it", async () => {
  const fetchMock = vi.fn(async (url: string) => url === "/api/health" ? new Response(JSON.stringify({ services: {} })) : new Response(JSON.stringify({ report: report("Đã hoàn tất") })));
  vi.stubGlobal("fetch", fetchMock);
  render(<HomeApp {...props} />);
  fireEvent.click(screen.getByRole("tab", { name: "Email" }));
  fireEvent.change(screen.getByLabelText(/Người gửi \(From\)/), { target: { value: "notice@sender.example" } });
  fireEvent.change(screen.getByLabelText(/Nội dung email/), { target: { value: "Thư gốc" } });
  fireEvent.change(screen.getByLabelText("Bản gửi · Reply-To"), { target: { value: "reply@outside.example" } });
  fireEvent.change(screen.getByLabelText("Bản gửi · Tiêu đề"), { target: { value: "Đã sửa tiêu đề" } });
  fireEvent.change(screen.getByLabelText("Bản gửi · Ngữ cảnh"), { target: { value: "Ngữ cảnh đã sửa" } });
  fireEvent.change(screen.getByLabelText("Nội dung đã chuẩn bị để gửi"), { target: { value: "Mã OTP là 123456; hãy gửi mã OTP ngay." } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Che số điện thoại" }));
  expect(screen.getByLabelText("Nội dung đã chuẩn bị để gửi")).toHaveValue("Mã OTP là 123456; hãy gửi mã OTP ngay.");
  expect(screen.getByLabelText("Toàn bộ bản gửi sau khi che")).not.toHaveTextContent("123456");
  fireEvent.click(screen.getByRole("button", { name: /Quét dấu hiệu/ }));
  await screen.findByText("Đã hoàn tất");
  const call = fetchMock.mock.calls.find(([url]) => url === "/api/analyze") as unknown as [string, RequestInit];
  const body = JSON.parse(String(call[1].body));
  expect(body).toMatchObject({ sender: "[PHẦN EMAIL ĐÃ CHE]@sender.example", replyTo: "[PHẦN EMAIL ĐÃ CHE]@outside.example", subject: "Đã sửa tiêu đề", context: "Ngữ cảnh đã sửa" });
  expect(body.content).not.toContain("123456");
});
it("keeps a late response from replacing a new report or clearing its busy state", async () => {
  const resolvers: Array<(value: Response) => void> = [];
  vi.stubGlobal("fetch", vi.fn((url: string) => url === "/api/health" ? Promise.resolve(new Response(JSON.stringify({ services: {} }))) : new Promise<Response>(resolve => resolvers.push(resolve))));
  render(<HomeApp {...props} />);
  const input = screen.getByLabelText(/Nội dung tin nhắn/);
  fireEvent.change(input, { target: { value: "Lượt A" } });
  fireEvent.click(screen.getByRole("button", { name: /Quét dấu hiệu/ }));
  fireEvent.change(input, { target: { value: "Lượt B" } });
  fireEvent.click(screen.getByRole("button", { name: /Quét dấu hiệu/ }));
  await act(async () => resolvers[0](new Response(JSON.stringify({ report: report("Kết quả cũ") }))));
  expect(screen.queryByText("Kết quả cũ")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Đang phân tích|Đang kiểm tra|AI đang/ })).toBeDisabled();
  await act(async () => resolvers[1](new Response(JSON.stringify({ report: report("Kết quả mới") }))));
  await waitFor(() => expect(screen.getByText("Kết quả mới")).toBeVisible());
});
it("changes practical advice based on the user's action without a provider request", () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  render(<ResponseActions />);
  expect(screen.queryByText(/tra soát, thu hồi/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Bạn đã thao tác gì?"), { target: { value: "paid" } });
  expect(screen.getByText(/tra soát, thu hồi/)).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();
});
