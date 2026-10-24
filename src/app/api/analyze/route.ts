import { randomUUID } from "node:crypto";
import { analyzeRequestSchema, analysisReportSchema, type Finding, type ModelReport } from "@/lib/analysis/schema";
import { attachVerifiedEvidence } from "@/lib/analysis/evidence";
import { getRuleFindings } from "@/lib/analysis/rules";
import { inspectUrl } from "@/lib/analysis/url";
import { buildAnalysisPrompt } from "@/lib/analysis/prompts";
import { analyzeWithDeepSeek } from "@/lib/ai/deepseek";
import { publicError } from "@/lib/ai/errors";
import { quotaLimitMessage, takeQuota } from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 64_000) return privateJson({ error: "Yêu cầu vượt quá giới hạn." }, 413);
  const userState = await getAuthenticatedUser().catch(() => ({ configured: false as const, client: null, user: null }));
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local-guest";

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 64_000) return privateJson({ error: "Yêu cầu vượt quá giới hạn." }, 413);
    let inputValue: unknown;
    try { inputValue = JSON.parse(raw); } catch { return privateJson({ error: "JSON đầu vào chưa hợp lệ." }, 400); }
    const inputResult = analyzeRequestSchema.safeParse(inputValue);
    if (!inputResult.success) return privateJson({ error: "Nội dung chưa đúng định dạng hoặc vượt giới hạn." }, 400);
    const input = inputResult.data;

    let hostname: string | undefined;
    const sourceId = randomUUID();
    let source = [
      input.sender && `Người gửi: ${input.sender}`,
      input.replyTo && `Reply-To: ${input.replyTo}`,
      input.subject && `Tiêu đề: ${input.subject}`,
      `Nội dung: ${input.content}`,
      input.context && `Ngữ cảnh: ${input.context}`,
    ].filter(Boolean).join("\n");

    if (input.type === "url" || input.type === "email") {
      const candidate = input.type === "url" ? input.content : input.content.match(/(?:https?:\/\/|www\.)[^\s<>"']+/i)?.[0];
      if (candidate) {
        try {
          const inspected = inspectUrl(candidate);
          hostname = inspected.hostname;
          if (input.type === "url") source += `\nHostname phân tích cú pháp (chưa kiểm chứng): ${inspected.hostname}\nTên miền đăng ký theo public suffix list (chưa kiểm chứng độ sở hữu): ${inspected.registrableDomain ?? "không xác định"}`;
        } catch { if (input.type === "url") return privateJson({ error: "URL chưa hợp lệ; hãy nhập một địa chỉ http hoặc https." }, 400); }
      }
    }

    const ruleFindings = getRuleFindings(input);
    let modelReport: ModelReport;
    if (process.env.SCAMLENS_DEMO_MODE === "true") {
      modelReport = { summary: "Đây là báo cáo minh họa; AI chưa được gọi.", riskLevel: "insufficient", findings: ruleFindings, checklist: ["Không chuyển tiền hoặc gửi mã xác thực chỉ dựa trên nội dung này.", "Tự mở ứng dụng/kênh liên hệ chính thức để xác minh."], limitations: ["Chế độ demo dùng quy tắc mẫu, không gọi AI."] };
    } else {
      const quota = await takeQuota({ ip, userId: userState.user?.id, provider: "deepseek" });
      if (!quota.allowed) return privateJson({ error: quotaLimitMessage(quota), retryAfterSeconds: quota.retryAfterSeconds }, 429, { "Retry-After": String(quota.retryAfterSeconds) });
      const prompt = buildAnalysisPrompt({ type: input.type, content: source, context: input.context, sender: input.sender, replyTo: input.replyTo, subject: input.subject, ruleFindings });
      modelReport = await analyzeWithDeepSeek(prompt);
    }

    const merged = new Map<string, Finding>();
    for (const finding of [...ruleFindings, ...modelReport.findings]) {
      const key = `${finding.category}:${finding.evidence.toLocaleLowerCase("vi-VN")}`;
      const current = merged.get(key);
      if (!current || severityValue(finding.severity) > severityValue(current.severity)) merged.set(key, finding);
    }
    const findings = attachVerifiedEvidence([...merged.values()], sourceId, source, input.confirmedOcr);
    const droppedUnverified = [...merged.values()].length - findings.length;
    const riskLevel = calculateRisk(findings, modelReport.riskLevel);
    const limitations = [...new Set([
      ...modelReport.limitations,
      "Ứng dụng không truy cập website hoặc xác minh người gửi/giao dịch bên ngoài.",
      input.type === "email" ? "Header kỹ thuật email chưa được kiểm chứng từ hộp thư nguồn." : "Kết quả chỉ phản ánh phần nội dung bạn đã cung cấp.",
      input.type === "image" ? (input.confirmedOcr ? "Bản đọc ảnh đã được người dùng xác nhận; chưa xác minh tính thật của hình ảnh hay giao dịch." : "Bản đọc do AI trích xuất và chưa được người dùng xác nhận; hãy đối chiếu trực tiếp với ảnh. Chưa xác minh tính thật của hình ảnh hay giao dịch.") : "",
      droppedUnverified ? "Đã ẩn dấu hiệu AI nêu ra nhưng không tìm thấy nguyên văn trong nguồn." : "",
    ].filter(Boolean))];
    const report = analysisReportSchema.parse({
      schemaVersion: "1.0", id: randomUUID(), createdAt: new Date().toISOString(), type: input.type, riskLevel,
      summary: modelReport.summary, findings, checklist: modelReport.checklist, limitations,
      source: { id: sourceId, content: source, confirmedOcr: input.confirmedOcr, hostname },
      model: { text: process.env.SCAMLENS_DEMO_MODE === "true" ? "demo-rules" : process.env.DEEPSEEK_MODEL || "unknown", image: input.type === "image" ? process.env.DEEPSEEK_MODEL : undefined },
    });
    return privateJson({ report, demo: process.env.SCAMLENS_DEMO_MODE === "true", saved: false });
  } catch (error) {
    const safe = publicError(error);
    return privateJson({ error: safe.message }, safe.status);
  }
}

function severityValue(value: string) { return value === "high" ? 3 : value === "medium" ? 2 : 1; }
function calculateRisk(findings: Array<{ severity: string }>, modelRisk: ModelReport["riskLevel"]): ModelReport["riskLevel"] {
  if (findings.some((finding) => finding.severity === "high")) return "high";
  if (findings.some((finding) => finding.severity === "medium")) return "medium";
  if (findings.length) return "low";
  return modelRisk === "insufficient" ? "insufficient" : "low";
}
