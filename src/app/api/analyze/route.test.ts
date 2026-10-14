import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

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
});
