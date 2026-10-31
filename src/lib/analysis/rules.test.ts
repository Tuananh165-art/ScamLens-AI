import { describe, expect, it } from "vitest";
import { getRuleFindings } from "./rules";

function findings(content: string) {
  return getRuleFindings({
    type: "message", content, context: "", sender: "", replyTo: "", subject: "",
    confirmedOcr: false, includeJev: false,
  });
}

describe("context-aware local findings", () => {
  it("does not label a safety warning as a request for credentials", () => {
    expect(findings("Không chia sẻ OTP hoặc mật khẩu cho bất kỳ ai.")).toEqual([]);
  });

  it("still detects an actionable credential request after a separate warning", () => {
    expect(findings("Không chia sẻ OTP. Tuy nhiên, hãy gửi mã xác thực 123456 để nhận tiền."))
      .toContainEqual(expect.objectContaining({ category: "secret_request", severity: "high", evidence: "gửi mã xác thực" }));
  });

  it("recognizes Vietnamese without diacritics and points to original source text", () => {
    expect(findings("Ngan hang yeu cau chuyen tien vao tai khoan ca nhan trong 10 phut."))
      .toContainEqual(expect.objectContaining({ category: "money_request" }));
  });

  it("does not treat a payment amount as a credential or account request", () => {
    expect(findings("Phí dịch vụ: 1.500.000 VND; hãy kiểm tra lại biên nhận."))
      .toEqual([]);
  });

  it("applies offline URL analysis to links in ordinary messages", () => {
    expect(findings("Nhận quà tại https://vietcombank-login.example.test/xin-otp"))
      .toContainEqual(expect.objectContaining({ category: "suspicious_url" }));
  });

  it("reports an email and Reply-To or link domain mismatch as a low-confidence check", () => {
    const result = getRuleFindings({
      type: "email", content: "Xem hóa đơn tại https://billing.example.test/invoice", context: "", sender: "Billing <notice@service.test>", replyTo: "reply@outside.test", subject: "Hóa đơn", confirmedOcr: false, includeJev: false,
    });
    expect(result.filter((item) => item.category === "inconsistency" && item.severity === "low")).toHaveLength(2);
  });
});
