import type { AnalyzeRequest, Finding } from "./schema";
import { inspectUrl } from "./url";
import { getDomain } from "tldts";
import { emailDomain } from "./email";

type NormalizedText = { text: string; starts: number[]; widths: number[] };
type LocalRule = { category: Finding["category"]; severity: Finding["severity"]; pattern: RegExp; title: string; explanation: string };

const rules: LocalRule[] = [
  {
    category: "secret_request", severity: "high",
    pattern: /\b(?:gui|cung cap|nhap|doc|chia se|yeu cau.{0,18}(?:gui|cung cap|nhap|doc)|de nghi.{0,18}(?:gui|cung cap|nhap|doc))\b.{0,38}\b(?:ma otp|otp|ma xac thuc|ma xac nhan|mat khau|password|ma pin|pin|cvv|cvc)\b/iu,
    title: "Có yêu cầu cung cấp thông tin xác thực",
    explanation: "Câu chữ yêu cầu gửi, nhập hoặc cung cấp thông tin xác thực. Không đọc mã hay mật khẩu cho người khác.",
  },
  {
    category: "money_request", severity: "medium",
    pattern: /\b(?:hay|vui long|can|yeu cau|de nghi|anh|chi|ban|em)\b.{0,25}\b(?:chuyen tien|chuyen khoan|nop phi|dong phi|thanh toan|nap tien|gui tien)\b|\b(?:chuyen tien|chuyen khoan|nop phi|dong phi|nap tien|gui tien)\b.{0,30}\b(?:vao|cho|ngay|de|truoc|hom nay)\b/iu,
    title: "Có yêu cầu liên quan đến tiền",
    explanation: "Nội dung có lời đề nghị thanh toán hoặc chuyển tiền. Hãy tự mở ứng dụng chính thức và kiểm tra người nhận.",
  },
  {
    category: "urgency", severity: "medium",
    pattern: /\b(?:ngay lap tuc|trong (?:vong )?\d+ phut|truoc \d{1,2}h\d{0,2}|(?:neu )?khong.{0,35}(?:dinh chi|bi khoa|se khoa|se huy|se mat)|sap bi khoa|khoa tai khoan|chi con.{0,18}suat|han chot.{0,15}hom nay|urgent|act now)\b/iu,
    title: "Có lời thúc ép hoặc gây áp lực",
    explanation: "Cụm từ tạo áp lực thời gian hoặc hậu quả cần được xem xét cùng yêu cầu cụ thể.",
  },
  {
    category: "impersonation", severity: "low",
    pattern: /\b(?:shipper day|tu xung|toi la|chung toi la|nhan danh|thay mat|can bo|nhan vien)\b.{0,40}\b(?:cong an|ngan hang|co quan thue|bu u dien|vneid|dich vu cong|truong hoc|shipper|giao hang)\b|\bshipper day\b/iu,
    title: "Người gửi tự xưng đại diện một tổ chức",
    explanation: "Lời tự xưng không xác minh được danh tính. Hãy liên hệ tổ chức qua kênh bạn tự tìm độc lập.",
  },
];

export function getRuleFindings(request: AnalyzeRequest): Finding[] {
  const sourceFields = [request.sender, request.replyTo, request.subject, request.content, request.context].filter(Boolean);
  const sourceText = sourceFields.join("\n");
  const normalized = normalizeWithPositions(sourceText);
  const findings: Finding[] = [];

  const fromDomain = emailDomain(request.sender);
  const replyDomain = emailDomain(request.replyTo);
  if (fromDomain && replyDomain) {
    if (fromDomain && replyDomain && fromDomain.toLocaleLowerCase() !== replyDomain.toLocaleLowerCase()) findings.push({
      category: "inconsistency", severity: "low", title: "Tên miền người gửi và Reply-To khác nhau",
      explanation: "Địa chỉ trả lời khác tên miền người gửi. Điều này có thể hợp lệ nhưng nên tự kiểm tra trước khi cung cấp thông tin.",
      evidence: request.replyTo.slice(0, 300),
    });
  }

  for (const clause of splitClauses(normalized.text)) {
    const rawSentence = normalized.text.slice(clause.start, clause.end);
    const leadingWhitespace = rawSentence.match(/^\s*/u)?.[0].length ?? 0;
    const sentence = rawSentence.trim();
    if (!sentence) continue;

    for (const rule of rules) {
      if (["secret_request", "money_request"].includes(rule.category) && isRequestDenial(sentence)) continue;
      const match = rule.pattern.exec(sentence);
      if (!match) continue;
      const normalizedStart = clause.start + leadingWhitespace + match.index;
      const normalizedEnd = normalizedStart + match[0].length;
      const start = normalized.starts[normalizedStart];
      const last = normalizedEnd - 1;
      const end = normalized.starts[last] + normalized.widths[last];
      const evidence = sourceText.slice(start, end).trim();
      if (!evidence) continue;
      findings.push({ category: rule.category, severity: rule.severity, title: rule.title, explanation: rule.explanation, evidence });
    }
  }

  const seenUrls = new Set<string>();
  const senderSite = request.type === "email" ? fromDomain : null;
  const urlPattern = /(?:https?:\/\/|www\.)[^\s<>"']+/giu;
  for (const match of sourceText.matchAll(urlPattern)) {
    const candidate = match[0].replace(/[),.;!?]+$/u, "");
    if (seenUrls.has(candidate)) continue;
    seenUrls.add(candidate);
    try {
      const inspected = inspectUrl(candidate);
      const linkedSite = getDomain(inspected.hostname, { allowPrivateDomains: true });
      if (senderSite && linkedSite && senderSite.toLocaleLowerCase() !== linkedSite.toLocaleLowerCase()) findings.push({
        category: "inconsistency", severity: "low", title: "Tên miền liên kết khác tên miền email",
        explanation: "Tên miền của liên kết khác nơi nhận thư. Đây có thể là dịch vụ hợp lệ; hãy tự kiểm tra đích đến trước khi mở.",
        evidence: candidate.slice(0, 300),
      });
      for (const signal of inspected.signals) {
        findings.push({ category: "suspicious_url", severity: "low", title: "Đặc điểm đường dẫn cần tự kiểm tra", explanation: signal, evidence: candidate.slice(0, 300) });
      }
    } catch { /* Invalid links do not trigger a network request. */ }
  }

  return deduplicate(findings);
}

export function isRequestDenial(clause: string) {
  const text = clause.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
  return /\b(?:khong (?:bao gio )?|dung )(?:can )?(?:(?:yeu cau|de nghi) (?:ban )?)?(?:gui|cung cap|nhap|doc|chia se|chuyen|thanh toan|nop|dong)\b/iu.test(text)
    || /\b(?:canh bao|khuyen cao|tin duoc chuyen tiep)\b.{0,70}\b(?:ke gian|nguoi la|nha tuyen dung|lua dao)\b/iu.test(text);
}

function splitClauses(text: string) {
  const clauses: Array<{ start: number; end: number }> = [];
  const boundary = /[.!?;,\n]+|\bnhung\b|\btuy nhien\b|\bmat khac\b|\broi\b/giu;
  let start = 0;
  for (const match of text.matchAll(boundary)) {
    const end = match.index ?? start;
    if (end > start) clauses.push({ start, end });
    start = end + match[0].length;
  }
  if (start < text.length) clauses.push({ start, end: text.length });
  return clauses;
}

function normalizeWithPositions(source: string): NormalizedText {
  let text = "";
  const starts: number[] = [];
  const widths: number[] = [];
  let pendingSpace: { start: number; width: number } | undefined;

  for (let index = 0; index < source.length;) {
    const point = source.codePointAt(index)!;
    const char = String.fromCodePoint(point);
    const width = char.length;
    const normalized = char.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
    const kept = [...normalized].filter((part) => /[\p{L}\p{N}]/u.test(part)).join("");

    if (kept) {
      if (pendingSpace && text) { text += " "; starts.push(pendingSpace.start); widths.push(pendingSpace.width); }
      pendingSpace = undefined;
      for (const part of kept) { text += part; starts.push(index); widths.push(width); }
    } else if (/[.!?;,\n]/u.test(char)) {
      pendingSpace = undefined;
      text += char; starts.push(index); widths.push(width);
    } else if (/\s/u.test(char)) {
      pendingSpace = { start: index, width };
    }
    index += width;
  }
  return { text, starts, widths };
}

function deduplicate(findings: Finding[]) {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.category}:${finding.evidence.toLocaleLowerCase("vi-VN")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
