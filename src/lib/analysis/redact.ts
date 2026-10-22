const RULES: Array<[RegExp, string]> = [
  [/(\b(?:access[_ -]?token|refresh[_ -]?token|authorization|bearer|api[_ -]?key|session[_ -]?token)\s*[:=]?\s*(?:bearer\s+)?)([A-Za-z0-9._~+/=-]{8,})/gi, "$1[TOKEN ĐÃ CHE]"],
  [/(\b(?:otp|mã otp|mã xác nhận|verification code)\s*[:=]?\s*)\d{4,8}\b/gi, "$1[OTP ĐÃ CHE]"],
  [/(\b(?:password|mật khẩu|mật khẩu là)\s*[:=]?\s*)\S{4,}/gi, "$1[MẬT KHẨU ĐÃ CHE]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL ĐÃ CHE]"],
  [/(?<!\d)(?:\+?84|0)(?:[ .-]?\d){8,10}(?!\d)/g, "[SỐ ĐIỆN THOẠI ĐÃ CHE]"],
  [/(?<!\d)\d{12,19}(?!\d)/g, "[SỐ DÀI ĐÃ CHE]"],
  [/(?<!\d)\d{4}[ -]?\d{2,10}(?!\d)/g, "[MÃ/SỐ TÀI KHOẢN ĐÃ CHE]"],
];

export function redactSensitiveText(input: string): string {
  return RULES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
}

export function hasSensitiveText(input: string): boolean {
  return redactSensitiveText(input) !== input;
}

export function countSensitiveMatches(input: string): number {
  let count = 0;
  let remaining = input;
  for (const [pattern] of RULES) {
    const matcher = new RegExp(pattern.source, pattern.flags);
    remaining = remaining.replace(matcher, () => {
      count += 1;
      return "[SENSITIVE]";
    });
  }
  return count;
}
