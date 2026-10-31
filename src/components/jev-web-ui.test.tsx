import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomeApp } from "./home-app";
import { JevAssessmentCard } from "./jev-assessment-card";
import { JEV_SIGNAL_IDS } from "@/lib/ai/jev-signals";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("lets a user opt into JEV and renders its supplementary result in the web report", async () => {
  const report = {
    schemaVersion: "1.0",
    id: "f37d0b8c-54f3-4e23-9181-ef9ece55b0b4",
    createdAt: "2026-10-27T08:00:00.000Z",
    type: "message",
    riskLevel: "high",
    summary: "Nội dung yêu cầu cung cấp mã xác thực.",
    findings: [],
    checklist: ["Tự mở ứng dụng chính thức để xác minh."],
    limitations: [],
    source: { id: "source-1", content: "Tài khoản bị khóa. Gửi OTP ngay.", confirmedOcr: false },
    model: { text: "deepseek-test-model" },
    jev: {
      status: "complete",
      model: "jev-1.14.0",
      sufficiency: "usable",
      sufficiencyConfidence: 0.88,
      diagnostics: { latencyMs: 420, inputTokens: 140, outputTokens: 28 },
      signals: [
        { id: "requests_credentials", probability: 0.95, result: "present" },
        { id: "requests_identity_documents", probability: 0.08, result: "not_detected" },
        { id: "requests_payment", probability: 0.05, result: "not_detected" },
        { id: "requests_app_or_remote_access", probability: 0.06, result: "not_detected" },
        { id: "uses_pressure", probability: 0.81, result: "present" },
        { id: "demands_secrecy", probability: 0.12, result: "not_detected" },
        { id: "claims_authority", probability: 0.1, result: "not_detected" },
        { id: "bypasses_official_channel", probability: 0.2, result: "not_detected" },
        { id: "promises_guaranteed_return", probability: 0.4, result: "uncertain" },
      ],
    },
  };
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url) === "/api/health") return new Response(JSON.stringify({ services: { jev: true } }), { status: 200 });
    if (String(url) === "/api/analyze") return new Response(JSON.stringify({ report, demo: false }), { status: 200 });
    throw new Error(`Unexpected request ${String(url)} ${String(init?.method ?? "GET")}`);
  });
  vi.stubGlobal("fetch", fetchMock);

  render(<HomeApp signedIn={false} email={null} avatarUrl={null} authConfigured={false} />);
  const jevCheckbox = await screen.findByRole("checkbox", { name: /Đối chiếu thêm bằng JEV/ });
  fireEvent.click(jevCheckbox);
  fireEvent.change(screen.getByLabelText(/Nội dung tin nhắn/), { target: { value: "Tài khoản bị khóa. Gửi OTP ngay." } });
  fireEvent.click(screen.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ }));

  expect(await screen.findByText("Đối chiếu hành vi bằng JEV")).toBeVisible();
  expect(screen.getByText("9 tín hiệu")).toBeVisible();
  expect(screen.getByText("Mức độ đủ dữ kiện")).toBeVisible();
  expect(screen.queryByText(/Bản OCR chưa được bạn xác nhận/)).not.toBeInTheDocument();
  const analyzeCall = fetchMock.mock.calls.find(([url]) => String(url) === "/api/analyze");
  expect(JSON.parse(String(analyzeCall?.[1]?.body))).toMatchObject({ includeJev: true });
});

it("does not present low scores as reassurance when JEV reports limited context", () => {
  render(<JevAssessmentCard assessment={{
    status: "complete", model: "jev-1.14.0", sufficiency: "limited", sufficiencyConfidence: 0.93,
    signals: JEV_SIGNAL_IDS.map((id) => ({ id, probability: 0.03, result: "not_detected" as const })),
  }} sourceType="url" />);

  expect(screen.getAllByText("Chưa đủ ngữ cảnh")).toHaveLength(9);
  expect(screen.getByText(/JEV đánh giá hành vi.*không tra cứu danh tiếng tên miền/)).toBeVisible();
  expect(screen.getByText(/thiếu ngữ cảnh không phải bằng chứng rằng nội dung an toàn/)).toBeVisible();
});
