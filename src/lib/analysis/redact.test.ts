import { describe, expect, it } from "vitest";
import { countSensitiveMatches, hasSensitiveText, redactSensitiveText } from "./redact";

describe("redactSensitiveText", () => {
  it("masks email, Vietnamese phone, and digit runs", () => {
    const result = redactSensitiveText("email linh@example.com goi 0912345678 ma 123456789012");
    expect(result).not.toContain("linh@example.com");
    expect(result).not.toContain("0912345678");
    expect(result).not.toContain("123456789012");
  });

  it("masks credential values but preserves their labels", () => {
    expect(redactSensitiveText("OTP: 493201 mật khẩu: Sup3rSecret")).toBe("OTP: [OTP ĐÃ CHE] mật khẩu: [MẬT KHẨU ĐÃ CHE]");
  });

  it("masks bearer and query token values", () => {
    expect(redactSensitiveText("Authorization: Bearer abcdefgh.ijklmnop link?access_token=abcdefghijklmnopqrstuvwxyz"))
      .toContain("TOKEN ĐÃ CHE");
    expect(redactSensitiveText("access_token=abcdefghijklmnopqrstuvwxyz"))
      .not.toContain("abcdefghijklmnopqrstuvwxyz");
  });

  it("leaves ordinary text unchanged and reports no match", () => {
    expect(redactSensitiveText("Hẹn gặp lúc 3 giờ chiều nhé.")).toBe("Hẹn gặp lúc 3 giờ chiều nhé.");
    expect(hasSensitiveText("Bản tin thường ngày.")).toBe(false);
  });

  it("does not redact an OTP request when no OTP value is present", () => {
    const message = "Hãy gửi mã OTP để xác minh ngay.";
    expect(redactSensitiveText(message)).toBe(message);
    expect(hasSensitiveText(message)).toBe(false);
  });

  it("counts unique values using the same ordered rules as redaction", () => {
    expect(countSensitiveMatches("OTP: 123456, email linh@example.com, phone 0912345678")).toBe(3);
  });
});
