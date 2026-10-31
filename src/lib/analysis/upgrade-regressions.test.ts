import { describe, expect, it } from "vitest";
import { redactSensitiveText } from "./redact";
import { prepareSource, formatSource, EMPTY_FIELDS } from "./payload";
import { getRuleFindings } from "./rules";
import { inspectUrl } from "./url";
import { attachVerifiedEvidence } from "./evidence";

describe("privacy and local-analysis regressions", () => {
  it("rejects a clipped quote that inverts explicit safety advice", () => {
    expect(attachVerifiedEvidence([{ category: "secret_request", severity: "high", title: "Yêu cầu OTP", explanation: "Người gửi yêu cầu chia sẻ OTP.", evidence: "chia sẻ OTP" }], "s1", "Không chia sẻ OTP cho bất kỳ ai.", false)).toEqual([]);
  });
  it("masks common Vietnamese OTP phrasing, spaced OTPs and international phones", () => {
    for (const secret of ["Mã OTP là 123456", "ma xac thuc cua ban la 123456", "OTP: 123 456", "CVV là 123"]) {
      expect(redactSensitiveText(secret)).not.toMatch(/123/);
    }
    for (const phone of ["+84901234567", "+84 901 234 567", "0901234567"]) {
      expect(redactSensitiveText(phone)).toContain("SỐ ĐIỆN THOẠI ĐÃ CHE");
    }
    const prepared = redactSensitiveText("OTP là 123456; password: SampleSecret");
    expect(redactSensitiveText(prepared)).toBe(prepared);
  });

  it("keeps email domain comparison after masking the mailbox", () => {
    const fields = prepareSource({ ...EMPTY_FIELDS, content: "Hãy kiểm tra thư.", sender: "Meta <notice@meta-policy.example>", replyTo: "reply@outside.example" });
    expect(getRuleFindings({ ...fields, type: "email", confirmedOcr: false, includeJev: false }))
      .toContainEqual(expect.objectContaining({ category: "inconsistency", evidence: fields.replyTo }));
    expect(formatSource(fields)).toContain("Reply-To: " + fields.replyTo);
  });

  it("recognizes the shipper's payment and time pressure without flagging safety advice", () => {
    const input = { ...EMPTY_FIELDS, type: "message" as const, confirmedOcr: false, includeJev: false };
    expect(getRuleFindings({ ...input, content: "Anh chuyển khoản vào tài khoản này rồi đọc mã OTP ngân hàng trong 2 phút nhé." }).map(x => x.category))
      .toEqual(expect.arrayContaining(["money_request", "secret_request", "urgency"]));
    expect(getRuleFindings({ ...input, content: "Không chuyển tiền. Không chia sẻ OTP." })).toEqual([]);
    expect(getRuleFindings({ ...input, content: "Ngân hàng không bao giờ yêu cầu bạn cung cấp mã OTP." })).toEqual([]);
    expect(getRuleFindings({ ...input, content: "Không chia sẻ OTP, hãy gửi mã OTP cho tôi." })).toContainEqual(expect.objectContaining({ category: "secret_request" }));
  });

  it("accepts Techcombank's official website and distinguishes misleading subdomains", () => {
    expect(inspectUrl("https://techcombank.com").spoofedBrand).toBeUndefined();
    expect(inspectUrl("https://techcombank.com.attacker.example").spoofedBrand).toBe("Techcombank");
    expect(inspectUrl("https://vneid.demo.example").isExample).toBe(true);
    expect(inspectUrl("https://one.blogspot.com").registrableDomain).toBe("one.blogspot.com");
  });
});
