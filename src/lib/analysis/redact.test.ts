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

  it("preserves an email domain and payment amounts while masking the mailbox and phone", () => {
    expect(redactSensitiveText("From: notice@bank-suspect.test, gọi 0912345678, phí 1.500.000 VND"))
      .toBe("From: [PHẦN EMAIL ĐÃ CHE]@bank-suspect.test, gọi [SỐ ĐIỆN THOẠI ĐÃ CHE], phí 1.500.000 VND");
  });

  it("masks labeled citizen ID and account numbers without masking neighboring money values", () => {
    expect(redactSensitiveText("CCCD: 012345678901; số tài khoản: 001234567890; nhận 1.500.000 đồng"))
      .toBe("CCCD: [SỐ GIẤY TỜ ĐÃ CHE]; số tài khoản: [SỐ TÀI KHOẢN ĐÃ CHE]; nhận 1.500.000 đồng");
  });

  it("allows opting to keep email addresses and phone numbers but always masks credentials", () => {
    expect(redactSensitiveText("mail linh@example.test, 0912345678, OTP: 123456", { email: false, phone: false, identity: true, account: true }))
      .toBe("mail linh@example.test, 0912345678, OTP: [OTP ĐÃ CHE]");
  });

  it("allows keeping one sensitive value while keeping mandatory credentials masked", () => {
    expect(redactSensitiveText("Email linh@example.test, gọi 0912345678, OTP 123456", { keepValues: ["linh", "0912345678"] }))
      .toBe("Email linh@example.test, gọi 0912345678, OTP [OTP ĐÃ CHE]");
  });
});
