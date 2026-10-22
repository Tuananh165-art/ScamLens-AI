export type HeuristicSignal = { id: "urgency" | "credentials" | "impersonation"; label: string; evidence: string };

const detectors: Array<{ id: HeuristicSignal["id"]; label: string; pattern: RegExp }> = [
  { id: "urgency", label: "Áp lực thời gian", pattern: /\b(?:ngay lập tức|trước \d{1,2}h\d{0,2}|trong vòng \d+ phút|khẩn cấp|cấp cứu|hạn chót|hôm nay|chỉ còn \w+ suất)\b/iu },
  { id: "credentials", label: "Thông tin xác thực", pattern: /\b(?:mã otp|otp|mật khẩu|password|mã pin|số thẻ căn cước|cccd|smart otp)\b/iu },
  { id: "impersonation", label: "Tự xưng tổ chức", pattern: /\b(?:bộ công an|viện kiểm sát|cảnh sát giao thông|vneid|ngân hàng|cơ quan thuế|dịch vụ công|cán bộ)\b/iu },
];

export function detectLiveHeuristics(text: string): HeuristicSignal[] {
  return detectors.flatMap(({ id, label, pattern }) => {
    const match = pattern.exec(text);
    return match ? [{ id, label, evidence: match[0] }] : [];
  });
}
