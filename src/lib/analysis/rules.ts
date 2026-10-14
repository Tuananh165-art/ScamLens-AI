import type { AnalyzeRequest, Finding } from "./schema";

const checks: Array<{ category: Finding["category"]; severity: Finding["severity"]; pattern: RegExp; title: string; explanation: string }> = [
  { category: "secret_request", severity: "high", pattern: /\b(?:otp|mã otp|mã xác thực|mã xác nhận|mật khẩu|password|cvv|mã pin)\b/iu, title: "Có nhắc đến mã hoặc thông tin xác thực", explanation: "Tin nhắn đề cập đến dữ liệu xác thực. Không gửi OTP, mật khẩu, mã PIN hoặc CVV qua chat hay cuộc gọi." },
  { category: "money_request", severity: "medium", pattern: /\b(?:chuyển khoản|chuyển tiền|đóng phí|nộp phí|thanh toán ngay|tài khoản nhận|bank transfer)\b/iu, title: "Có yêu cầu liên quan đến tiền", explanation: "Nội dung nhắc đến chuyển tiền hoặc thanh toán. Hãy mở ứng dụng chính thức và xác minh người nhận qua kênh độc lập." },
  { category: "urgency", severity: "medium", pattern: /\b(?:ngay lập tức|trong vòng \d+ phút|khẩn cấp|sắp bị khóa|khóa tài khoản|giữ bí mật|không được nói|urgent|act now)\b/iu, title: "Có ngôn ngữ thúc ép hoặc gây áp lực", explanation: "Câu chữ tạo cảm giác phải hành động nhanh hoặc giữ bí mật. Tạm dừng và tự liên hệ đơn vị qua số trên thẻ/website đã biết." },
  { category: "impersonation", severity: "low", pattern: /\b(?:ngân hàng|công an|thuế|bưu điện|customer support|hỗ trợ khách hàng)\b/iu, title: "Có nhắc đến tổ chức hoặc bộ phận hỗ trợ", explanation: "Việc tự xưng là một tổ chức không chứng minh danh tính. Hãy mở ứng dụng hoặc gọi số liên hệ lấy từ nguồn chính thức." },
];

export function getRuleFindings(request: AnalyzeRequest): Finding[] {
  const text = [request.sender && `Người gửi: ${request.sender}`, request.replyTo && `Reply-To: ${request.replyTo}`, request.subject && `Tiêu đề: ${request.subject}`, request.content].filter(Boolean).join("\n");
  const findings: Finding[] = [];

  for (const check of checks) {
    const match = check.pattern.exec(text);
    if (!match || !match[0]) continue;
    if (check.category === "impersonation" && findings.some((f) => f.category === "money_request" || f.category === "secret_request")) {
      // The same source fragment supports one stronger actionable finding.
      continue;
    }
    findings.push({ category: check.category, severity: check.severity, title: check.title, explanation: check.explanation, evidence: match[0] });
  }

  if (request.type === "url" || request.type === "email") {
    const urlMatch = text.match(/(?:https?:\/\/|www\.)[^\s<>"']+/i);
    if (urlMatch) {
      try {
        const { signals } = requireUrl(urlMatch[0]);
        for (const signal of signals) findings.push({ category: "suspicious_url", severity: "low", title: "Đặc điểm URL cần tự kiểm tra", explanation: signal, evidence: urlMatch[0] });
      } catch { /* Invalid links are handled as incomplete input and never fetched. */ }
    }
  }

  return findings;
}

function requireUrl(value: string) {
  // Keep URL parsing synchronous in the rule engine while avoiding any network request.
  return inspect(value);
}

import { inspectUrl as inspect } from "./url";
