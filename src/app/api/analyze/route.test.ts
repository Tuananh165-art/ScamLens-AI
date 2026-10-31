import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithDeepSeekDetailed } from "@/lib/ai/deepseek";
import { analyzeWithJev, isJevWebAvailable, reviewClaimsWithJev } from "@/lib/ai/jev";
import { takeAdditionalProviderQuota, takeQuota } from "@/lib/security/rate-limit";
import { POST } from "./route";
import { JEV_SIGNAL_IDS } from "@/lib/ai/jev-signals";

vi.mock("@/lib/ai/deepseek", () => ({
  analyzeWithDeepSeekDetailed: vi.fn(),
  readImage: vi.fn(),
}));
vi.mock("@/lib/ai/jev", () => ({
  analyzeWithJev: vi.fn(),
  isJevWebAvailable: vi.fn(),
  reviewClaimsWithJev: vi.fn(),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  takeQuota: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0, backend: "local" }),
  takeAdditionalProviderQuota: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0, backend: "local" }),
  quotaLimitMessage: (result: { reason?: string; retryAfterSeconds: number }) => result.reason === "per_minute"
    ? `Bạn đã đạt giới hạn lượt trong một phút. Hãy thử lại sau khoảng ${result.retryAfterSeconds} giây.`
    : "Bạn đã dùng hết lượt hôm nay.",
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.mocked(isJevWebAvailable).mockReturnValue(false);
});

async function analyze(content: string, includeJev = false) {
  const request = new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "message", content, includeJev }),
  });
  const response = await POST(request);
  return { status: response.status, retryAfter: response.headers.get("Retry-After"), body: await response.json() };
}

describe("POST /api/analyze", () => {
  it("rejects a model claim that clips a negation from a matching OTP quote", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ model: "fixture", report: { summary: "Rủi ro cao", riskLevel: "high", findings: [{ category: "secret_request", severity: "high", title: "Yêu cầu OTP", explanation: "Người gửi yêu cầu chia sẻ OTP.", evidence: "chia sẻ OTP" }], checklist: [], limitations: [] } });
    const result = await analyze("Không chia sẻ OTP cho bất kỳ ai.");
    expect(result.body.report.riskLevel).toBe("insufficient");
    expect(result.body.report.findings).toEqual([]);
    expect(result.body.report.summary).not.toContain("Rủi ro cao");
  });
  it("keeps the primary warning and records a bounded optional JEV claim disagreement", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("TYPESAFE_EVIDENCE_REVIEW_ENABLED", "true");
    vi.mocked(isJevWebAvailable).mockReturnValue(true);
    vi.mocked(takeAdditionalProviderQuota).mockResolvedValue({ allowed: true, retryAfterSeconds: 0, backend: "local" });
    vi.mocked(analyzeWithJev).mockResolvedValue({ inputTokens: 1, latencyMs: 1, assessment: { status: "complete", model: "jev-1.14.0", sufficiency: "usable", signals: JEV_SIGNAL_IDS.map(id => ({ id, result: "not_detected", probability: 0.1 })) } });
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ model: "fixture", report: { summary: "Có yêu cầu OTP", riskLevel: "high", findings: [{ category: "secret_request", severity: "high", title: "Yêu cầu OTP", explanation: "Người gửi yêu cầu gửi OTP.", evidence: "Gửi OTP ngay" }], checklist: [], limitations: [] } });
    vi.mocked(reviewClaimsWithJev).mockResolvedValue([{ category: "secret_request", claim: "Yêu cầu OTP. Người gửi yêu cầu gửi OTP.", quote: "Gửi OTP ngay", status: "unsupported", method: "jev", confidence: 0.9 }]);
    const result = await analyze("Gửi OTP ngay.", true);
    expect(result.status).toBe(200);
    expect(result.body.report.riskLevel).toBe("high");
    expect(result.body.report.evidenceReviewStatus).toBe("complete");
    expect(result.body.report.evidenceReviews[0].status).toBe("unsupported");
    expect(reviewClaimsWithJev).toHaveBeenCalledOnce();
    vi.mocked(reviewClaimsWithJev).mockRejectedValueOnce(new Error("provider failure"));
    const fallback = await analyze("Gửi OTP ngay.", true);
    expect(fallback.body.report.riskLevel).toBe("high");
    expect(fallback.body.report.evidenceReviewStatus).toBe("unavailable");
  });
  it("returns a demo report with high risk and an exact OTP source reference", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "true");
    const result = await analyze("[MẪU] Tài khoản sắp bị khóa. Gửi OTP ngay.");

    expect(result.status).toBe(200);
    expect(result.body.demo).toBe(true);
    expect(result.body.report.riskLevel).toBe("high");
    expect(result.body.report.findings.some((item: { category: string; evidence: string }) => item.category === "secret_request" && item.evidence.includes("Gửi OTP"))).toBe(true);
    expect(result.body.report.findings.every((item: { evidenceRefs: Array<{ quote: string }> }) => item.evidenceRefs.length > 0 && item.evidenceRefs[0].quote)).toBe(true);
  });

  it("returns insufficient instead of a false safe label when content is too sparse", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "true");
    const result = await analyze("?");

    expect(result.status).toBe(200);
    expect(result.body.report.riskLevel).toBe("insufficient");
    expect(result.body.report.findings).toHaveLength(0);
  });

  it("uses DeepSeek for live text analysis and reports the DeepSeek model", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-test-model");
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ report: {
      summary: "Nội dung yêu cầu cung cấp mã xác thực.",
      riskLevel: "high",
      findings: [{ category: "secret_request", severity: "high", title: "Yêu cầu OTP", explanation: "Người gửi đề nghị gửi mã xác thực qua tin nhắn.", evidence: "Gửi OTP ngay" }],
      checklist: ["Tự mở ứng dụng chính thức để kiểm tra."],
      limitations: ["Chưa xác minh danh tính người gửi."],
    }, model: "deepseek-test-model" });

    const result = await analyze("Tài khoản sắp bị khóa. Gửi OTP ngay.");

    expect(result.status).toBe(200);
    expect(result.body.demo).toBe(false);
    expect(result.body.report.model.text).toBe("deepseek-test-model");
    expect(result.body.report.findings.some((item: { evidence: string }) => item.evidence === "Gửi OTP ngay")).toBe(true);
    expect(analyzeWithDeepSeekDetailed).toHaveBeenCalledOnce();
    expect(analyzeWithDeepSeekDetailed).toHaveBeenCalledWith(expect.stringContaining("SOURCE"));
  });

  it("re-applies mandatory masking on the server before storing or sending content", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ report: { summary: "Đã phân tích.", riskLevel: "insufficient", findings: [], checklist: [], limitations: [] }, model: "returned-model" });
    const result = await analyze("Hãy gửi OTP 654321 để tiếp tục.");
    expect(result.body.report.source.content).not.toContain("654321");
    expect(result.body.report.source.content).toContain("[OTP ĐÃ CHE]");
    expect(vi.mocked(analyzeWithDeepSeekDetailed).mock.calls[0][0]).not.toContain("654321");
    expect(result.body.report.model.text).toBe("returned-model");
    expect(result.body.report.metrics.aiStatus).toBe("complete");
  });

  it("replaces an unsupported high-risk conclusion and keeps the summary aligned with insufficient evidence", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ report: {
      summary: "Rủi ro cao: hãy chuyển tiền ngay.", riskLevel: "high",
      findings: [{ category: "money_request", severity: "high", title: "Yêu cầu chuyển tiền", explanation: "Nội dung yêu cầu chuyển tiền ngay.", evidence: "Câu trích dẫn không có trong nguồn" }],
      checklist: ["Tự kiểm chứng."], limitations: [],
    }, model: "deepseek-test-model" });

    const result = await analyze("Nội dung thông thường cần xem lại.");
    expect(result.body.report.riskLevel).toBe("insufficient");
    expect(result.body.report.summary).toContain("Chưa đủ bằng chứng");
    expect(result.body.report.summary).not.toContain("Rủi ro cao");
    expect(result.body.report.findings).toHaveLength(0);
  });

  it("keeps JEV opt-in and returns supplementary signals without changing the main risk", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-test-model");
    vi.mocked(isJevWebAvailable).mockReturnValue(true);
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ report: {
      summary: "Có yêu cầu gửi mã xác thực.", riskLevel: "high",
      findings: [{ category: "secret_request", severity: "high", title: "Yêu cầu OTP", explanation: "Nội dung yêu cầu gửi mã xác thực.", evidence: "Gửi OTP ngay" }],
      checklist: ["Tự mở ứng dụng chính thức để kiểm tra."], limitations: [],
    }, model: "deepseek-test-model" });
    vi.mocked(analyzeWithJev).mockResolvedValue({
      assessment: {
        status: "complete", model: "jev-1.14.0", sufficiency: "usable",
        signals: [
          { id: "requests_credentials", probability: 0.91, result: "present" },
          { id: "requests_payment", probability: 0.05, result: "not_detected" },
          { id: "uses_pressure", probability: 0.10, result: "not_detected" },
          { id: "claims_authority", probability: 0.10, result: "not_detected" },
          { id: "bypasses_official_channel", probability: 0.10, result: "not_detected" },
          { id: "promises_guaranteed_return", probability: 0.10, result: "not_detected" },
        ],
      }, inputTokens: 150, latencyMs: 800,
    });

    const result = await analyze("Tài khoản sắp bị khóa. Gửi OTP ngay. Mã OTP: 123456", true);

    expect(result.status).toBe(200);
    expect(result.body.report.riskLevel).toBe("high");
    expect(result.body.report.jev).toMatchObject({ status: "complete", model: "jev-1.14.0", sufficiency: "usable" });
    expect(analyzeWithJev).toHaveBeenCalledOnce();
    expect(takeAdditionalProviderQuota).toHaveBeenCalledWith("typesafe");
    expect(vi.mocked(analyzeWithJev).mock.calls[0][0].content).toContain("[OTP ĐÃ CHE]");
  });

  it("does not call JEV or DeepSeek when an opt-in request arrives while JEV is disabled", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.mocked(isJevWebAvailable).mockReturnValue(false);

    const result = await analyze("Nội dung mẫu cần kiểm tra.", true);

    expect(result.status).toBe(503);
    expect(analyzeWithJev).not.toHaveBeenCalled();
    expect(analyzeWithDeepSeekDetailed).not.toHaveBeenCalled();
  });

  it("requires user-confirmed OCR before sending image text to JEV", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.mocked(isJevWebAvailable).mockReturnValue(true);
    const response = await POST(new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "image", content: "Bản OCR giả lập", includeJev: true, confirmedOcr: false }),
    }));

    expect(response.status).toBe(400);
    expect(analyzeWithJev).not.toHaveBeenCalled();
    expect(analyzeWithDeepSeekDetailed).not.toHaveBeenCalled();
  });

  it("keeps the DeepSeek report when the optional JEV provider fails", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.mocked(isJevWebAvailable).mockReturnValue(true);
    vi.mocked(analyzeWithDeepSeekDetailed).mockResolvedValue({ report: { summary: "Đã phân tích.", riskLevel: "low", findings: [], checklist: ["Tự kiểm chứng."], limitations: [] }, model: "deepseek-test-model" });
    vi.mocked(analyzeWithJev).mockRejectedValue(new Error("provider detail must not escape"));

    const result = await analyze("Nội dung mẫu cần kiểm tra.", true);

    expect(result.status).toBe(200);
    expect(result.body.report.jev).toEqual({ status: "unavailable", reason: "provider_error" });
    expect(result.body.report.riskLevel).toBe("insufficient");
  });

  it("maps DeepSeek authorization failures to a safe provider error", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-test-model");
    vi.mocked(analyzeWithDeepSeekDetailed).mockRejectedValue(new Error("deepseek_auth_failed"));

    const result = await analyze("Mời kiểm tra thông báo.");

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("AI");
  });

  it("explains the app per-minute quota and returns the retry delay", async () => {
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    vi.mocked(takeQuota).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 18, backend: "upstash", reason: "per_minute" });

    const result = await analyze("Nội dung mẫu cần kiểm tra.");

    expect(result.status).toBe(429);
    expect(result.retryAfter).toBe("18");
    expect(result.body.retryAfterSeconds).toBe(18);
    expect(result.body.error).toContain("sau khoảng 18 giây");
    expect(analyzeWithDeepSeekDetailed).not.toHaveBeenCalled();
  });
});
