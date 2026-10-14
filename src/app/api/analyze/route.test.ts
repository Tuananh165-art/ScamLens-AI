import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithGemini } from "@/lib/ai/gemini";
import { POST } from "./route";

vi.mock("@/lib/ai/gemini", () => ({
  analyzeWithGemini: vi.fn(),
  readImage: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function analyze(content: string) {
  const request = new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "message", content }),
  });
  const response = await POST(request);
  return { status: response.status, body: await response.json() };
}

describe("POST /api/analyze", () => {
  it("returns a demo report with high risk and an exact OTP source reference", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "true");
    const result = await analyze("[MẪU] Tài khoản sắp bị khóa. Gửi OTP ngay.");

    expect(result.status).toBe(200);
    expect(result.body.demo).toBe(true);
    expect(result.body.report.riskLevel).toBe("high");
    expect(result.body.report.findings.some((item: { evidence: string }) => item.evidence === "OTP")).toBe(true);
    expect(result.body.report.findings.every((item: { evidenceRefs: Array<{ quote: string }> }) => item.evidenceRefs.length > 0 && item.evidenceRefs[0].quote)).toBe(true);
  });

  it("returns insufficient instead of a false safe label when content is too sparse", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "true");
    const result = await analyze("?");

    expect(result.status).toBe(200);
    expect(result.body.report.riskLevel).toBe("insufficient");
    expect(result.body.report.findings).toHaveLength(0);
  });

  it("uses Gemini for live text analysis and reports the Gemini model", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test-model");
    vi.mocked(analyzeWithGemini).mockResolvedValue({
      summary: "Nội dung yêu cầu cung cấp mã xác thực.",
      riskLevel: "high",
      findings: [{ category: "secret_request", severity: "high", title: "Yêu cầu OTP", explanation: "Người gửi đề nghị gửi mã xác thực qua tin nhắn.", evidence: "Gửi OTP ngay" }],
      checklist: ["Tự mở ứng dụng chính thức để kiểm tra."],
      limitations: ["Chưa xác minh danh tính người gửi."],
    });

    const result = await analyze("Tài khoản sắp bị khóa. Gửi OTP ngay.");

    expect(result.status).toBe(200);
    expect(result.body.demo).toBe(false);
    expect(result.body.report.model.text).toBe("gemini-test-model");
    expect(result.body.report.findings.some((item: { evidence: string }) => item.evidence === "Gửi OTP ngay")).toBe(true);
    expect(analyzeWithGemini).toHaveBeenCalledOnce();
    expect(analyzeWithGemini).toHaveBeenCalledWith(expect.stringContaining("SOURCE"));
  });

  it("maps Gemini authorization failures to a safe provider error", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test-model");
    vi.mocked(analyzeWithGemini).mockRejectedValue(new Error("gemini_auth_failed"));

    const result = await analyze("Mời kiểm tra thông báo.");

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("Gemini");
  });
});
