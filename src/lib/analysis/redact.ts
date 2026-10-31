export type RedactionPreferences = {
  email?: boolean;
  phone?: boolean;
  identity?: boolean;
  account?: boolean;
  keepValues?: string[];
};

export type SensitiveKind = "credential" | "email" | "phone" | "identity" | "account";
export type SensitiveMatch = { start: number; end: number; kind: SensitiveKind; value: string; mandatory: boolean };

type RedactionRule = {
  kind: SensitiveKind;
  pattern: RegExp;
  label: string;
  mandatory?: boolean;
  capture?: number;
};

const rules: RedactionRule[] = [
  { kind: "credential", pattern: /([?&#](?:token|code|secret|api_key|access_token|refresh_token)=)(?!\[)([^&#\s]+)/gi, label: "TOKEN ĐÃ CHE", mandatory: true, capture: 2 },
  { kind: "credential", pattern: /(\b(?:access[_ -]?token|refresh[_ -]?token|authorization|bearer|api[_ -]?key|session[_ -]?token)\s*[:=]?\s*(?:bearer\s+)?)([A-Za-z0-9._~+/=-]{8,})/gi, label: "TOKEN ĐÃ CHE", mandatory: true, capture: 2 },
  { kind: "credential", pattern: /(\b(?:otp|m[aã] otp|m[aã] x[aá]c th[uự]c|m[aã] x[aá]c nh[aậ]n|verification code)\s*(?:c[uủ]a b[aạ]n\s*)?(?:l[aà]\s*)?[:=]?\s*)(\d(?:[ -]?\d){3,7})(?!\d)/giu, label: "OTP ĐÃ CHE", mandatory: true, capture: 2 },
  { kind: "credential", pattern: /(\b(?:password|m[aậ]t kh[aẩ]u)\s*(?:c[uủ]a b[aạ]n\s*)?(?:l[aà]\s*)?[:=]?\s*)(?!\[)(\S{4,})/giu, label: "MẬT KHẨU ĐÃ CHE", mandatory: true, capture: 2 },
  { kind: "credential", pattern: /(\b(?:m[aã] pin|pin|cvv|cvc)\s*(?:l[aà]\s*)?[:=]?\s*)(\d{3,8})\b/giu, label: "MÃ BẢO MẬT ĐÃ CHE", mandatory: true, capture: 2 },
  { kind: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, label: "PHẦN EMAIL ĐÃ CHE" },
  { kind: "phone", pattern: /(?<![\d+])(?:\+?84[ .-]?[1-9](?:[ .-]?\d){8}|0[1-9](?:[ .-]?\d){8,9})(?!\d)/g, label: "SỐ ĐIỆN THOẠI ĐÃ CHE" },
  { kind: "identity", pattern: /\b(?:cccd|cmnd|số định danh|căn cước(?: công dân)?)\s*(?:số\s*)?[:=#]?\s*(\d(?:[ .-]?\d){8,11})\b/gi, label: "SỐ GIẤY TỜ ĐÃ CHE", capture: 1 },
  { kind: "account", pattern: /\b(?:số tài khoản|số tk|stk|tài khoản nhận)\s*[:=#]?\s*(\d(?:[ .-]?\d){5,18})\b/gi, label: "SỐ TÀI KHOẢN ĐÃ CHE", capture: 1 },
  { kind: "account", pattern: /(?<!\d)\d{12,19}(?!\d)(?!\s*(?:đồng|vnd|₫)\b)/gi, label: "SỐ DÀI ĐÃ CHE" },
];

const preferenceFor: Record<SensitiveKind, keyof RedactionPreferences | null> = {
  credential: null,
  email: "email",
  phone: "phone",
  identity: "identity",
  account: "account",
};

export function findSensitiveMatches(input: string): SensitiveMatch[] {
  const candidates: Array<SensitiveMatch & { priority: number }> = [];

  rules.forEach((rule, priority) => {
    const matcher = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of input.matchAll(matcher)) {
      const wholeMatch = match[0];
      const capture = rule.capture ? match[rule.capture] : undefined;
      let start = match.index ?? 0;
      let end = start + wholeMatch.length;

      if (capture) {
        const relative = wholeMatch.lastIndexOf(capture);
        start += relative;
        end = start + capture.length;
      } else if (rule.kind === "email") {
        const localPartLength = wholeMatch.indexOf("@");
        end = start + localPartLength;
      }

      candidates.push({ start, end, kind: rule.kind, value: input.slice(start, end), mandatory: rule.mandatory === true, priority });
    }
  });

  candidates.sort((a, b) => a.start - b.start || Number(b.mandatory) - Number(a.mandatory) || a.priority - b.priority);
  const result: SensitiveMatch[] = [];
  let occupiedUntil = -1;
  for (const candidate of candidates) {
    if (candidate.start < occupiedUntil || candidate.end <= candidate.start) continue;
    result.push({ start: candidate.start, end: candidate.end, kind: candidate.kind, value: candidate.value, mandatory: candidate.mandatory });
    occupiedUntil = candidate.end;
  }
  return result;
}

export function redactSensitiveText(input: string, preferences: RedactionPreferences = {}): string {
  const matches = findSensitiveMatches(input).filter((match) => {
    if (match.mandatory) return true;
    if (preferences.keepValues?.includes(match.value)) return false;
    const preference = preferenceFor[match.kind];
    return preference ? preferences[preference] !== false : false;
  });
  if (!matches.length) return input;

  let output = "";
  let cursor = 0;
  for (const match of matches) {
    output += input.slice(cursor, match.start);
    output += `[${match.kind === "credential" ? credentialLabel(input, match) : labelFor(match.kind)}]`;
    if (match.kind === "email") {
      const at = input.indexOf("@", match.start);
      output += input.slice(match.end, at + 1);
      cursor = at + 1;
    } else cursor = match.end;
  }
  return output + input.slice(cursor);
}

export function hasSensitiveText(input: string): boolean {
  return findSensitiveMatches(input).length > 0;
}

export function countSensitiveMatches(input: string): number {
  return findSensitiveMatches(input).length;
}

function labelFor(kind: SensitiveKind) {
  switch (kind) {
    case "credential": return "BÍ MẬT ĐÃ CHE";
    case "email": return "PHẦN EMAIL ĐÃ CHE";
    case "phone": return "SỐ ĐIỆN THOẠI ĐÃ CHE";
    case "identity": return "SỐ GIẤY TỜ ĐÃ CHE";
    case "account": return "SỐ TÀI KHOẢN ĐÃ CHE";
  }
}

function credentialLabel(input: string, match: SensitiveMatch) {
  const prefix = input.slice(Math.max(0, match.start - 60), match.start);
  if (/\b(?:otp|m[aã] otp|m[aã] x[aá]c th[uự]c|m[aã] x[aá]c nh[aậ]n|verification code)\s*(?:c[uủ]a b[aạ]n\s*)?(?:l[aà]\s*)?[:=]?\s*$/iu.test(prefix)) return "OTP ĐÃ CHE";
  if (/\b(?:password|m[aậ]t kh[aẩ]u)\s*(?:c[uủ]a b[aạ]n\s*)?(?:l[aà]\s*)?[:=]?\s*$/iu.test(prefix)) return "MẬT KHẨU ĐÃ CHE";
  if (/\b(?:m[aã] pin|pin|cvv|cvc)\s*(?:l[aà]\s*)?[:=]?\s*$/iu.test(prefix)) return "MÃ BẢO MẬT ĐÃ CHE";
  return "TOKEN ĐÃ CHE";
}
