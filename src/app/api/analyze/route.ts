import { randomUUID } from "node:crypto";
import { analyzeRequestSchema, analysisReportSchema, type ClaimReview, type Finding, type ModelReport } from "@/lib/analysis/schema";
import { attachVerifiedEvidence } from "@/lib/analysis/evidence";
import { getRuleFindings } from "@/lib/analysis/rules";
import { inspectUrl } from "@/lib/analysis/url";
import { buildAnalysisPrompt } from "@/lib/analysis/prompts";
import { analyzeWithDeepSeekDetailed } from "@/lib/ai/deepseek";
import { analyzeWithJev, isJevWebAvailable, reviewClaimsWithJev } from "@/lib/ai/jev";
import { publicError } from "@/lib/ai/errors";
import { quotaLimitMessage, takeAdditionalProviderQuota, takeQuota } from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http";
import { prepareSource, formatSource } from "@/lib/analysis/payload";

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
    const input = { ...inputResult.data, ...prepareSource(inputResult.data, inputResult.data.redactionPreferences) };
    if (input.includeJev && !isJevWebAvailable()) return privateJson({ error: "JEV hiện chưa được bật hoặc chưa sẵn sàng." }, 503);
    if (input.includeJev && input.type === "image" && !input.confirmedOcr) return privateJson({ error: "Hãy đọc lại và xác nhận chữ OCR trước khi gửi phần văn bản ảnh tới JEV." }, 400);

    let hostname: string | undefined;
    const sourceId = randomUUID();
    const source = formatSource(input);

    if (input.type === "url" || input.type === "email") {
      const candidate = input.type === "url" ? input.content : input.content.match(/(?:https?:\/\/|www\.)[^\s<>"']+/i)?.[0];
      if (candidate) {
        try {
          const inspected = inspectUrl(candidate);
          hostname = inspected.hostname;
        } catch { if (input.type === "url") return privateJson({ error: "URL chưa hợp lệ; hãy nhập một địa chỉ http hoặc https." }, 400); }
      }
    }

    const ruleFindings = getRuleFindings(input);
    let modelReport: ModelReport;
    let actualModel = "demo-rules";
    const startedAt = Date.now();
    let jevAssessment: Awaited<ReturnType<typeof analyzeWithJev>>["assessment"] | undefined;
    if (process.env.SCAMLENS_DEMO_MODE === "true") {
      modelReport = { summary: "Đây là báo cáo minh họa; AI chưa được gọi.", riskLevel: "insufficient", findings: ruleFindings, checklist: ["Không chuyển tiền hoặc gửi mã xác thực chỉ dựa trên nội dung này.", "Tự mở ứng dụng/kênh liên hệ chính thức để xác minh."], limitations: ["Chế độ demo dùng quy tắc mẫu, không gọi AI."] };
    } else {
      const quota = await takeQuota({ ip, userId: userState.user?.id, provider: "deepseek" });
      if (!quota.allowed) return privateJson({ error: quotaLimitMessage(quota), retryAfterSeconds: quota.retryAfterSeconds }, 429, { "Retry-After": String(quota.retryAfterSeconds) });
      const safeInput = input;
      const prompt = buildAnalysisPrompt({ type: input.type, content: source, context: input.context, sender: input.sender, replyTo: input.replyTo, subject: input.subject, ruleFindings });
      let jevAvailability: "quota" | "provider_error" | undefined;
      if (input.includeJev) {
        try {
          const jevQuota = await takeAdditionalProviderQuota("typesafe");
          if (!jevQuota.allowed) jevAvailability = "quota";
        } catch {
          jevAvailability = "provider_error";
        }
      }
      const jevInput = safeInput;
      const [deepseekResult, jevResult] = await Promise.all([
        analyzeWithDeepSeekDetailed(prompt),
        input.includeJev
          ? jevAvailability
            ? Promise.resolve({ assessment: { status: "unavailable" as const, reason: jevAvailability } })
            : analyzeWithJev(jevInput).catch(() => ({ assessment: { status: "unavailable" as const, reason: "provider_error" as const } }))
          : Promise.resolve(undefined),
      ]);
      modelReport = deepseekResult.report;
      actualModel = deepseekResult.model;
      jevAssessment = jevResult?.assessment;
    }

    const merged = new Map<string, Finding>();
    for (const finding of [...ruleFindings, ...modelReport.findings]) {
      const key = `${finding.category}:${finding.evidence.toLocaleLowerCase("vi-VN")}`;
      const current = merged.get(key);
      if (!current || severityValue(finding.severity) > severityValue(current.severity)) merged.set(key, finding);
    }
    const verified = attachVerifiedEvidence([...merged.values()], sourceId, source, input.confirmedOcr);
    const localFindings = attachVerifiedEvidence(ruleFindings, sourceId, source, input.confirmedOcr);
    const aiFindings = attachVerifiedEvidence(modelReport.findings, sourceId, source, input.confirmedOcr);
    let evidenceReviews: ClaimReview[] = aiFindings.map(finding => ({ category: finding.category, claim: finding.title + ". " + finding.explanation, quote: finding.evidenceRefs[0].quote, status: "insufficient", method: "local" }));
    let evidenceReviewStatus: "disabled" | "complete" | "unavailable" = "disabled";
    if (input.includeJev && process.env.TYPESAFE_EVIDENCE_REVIEW_ENABLED === "true" && process.env.SCAMLENS_DEMO_MODE !== "true" && aiFindings.length) {
      try {
        if (jevAssessment?.status !== "complete") throw new Error("review_unavailable");
        const quota = await takeAdditionalProviderQuota("typesafe");
        if (!quota.allowed) throw new Error("review_quota");
        const candidates = [...aiFindings].sort((a, b) => severityValue(b.severity) - severityValue(a.severity)).slice(0, 3).map(finding => ({ ...finding, evidence: finding.evidenceRefs[0].quote }));
        const reviews = await reviewClaimsWithJev(source, candidates);
        evidenceReviews = evidenceReviews.map(review => reviews.find(item => item.category === review.category && item.quote === review.quote) ?? review);
        evidenceReviewStatus = "complete";
      } catch { evidenceReviewStatus = "unavailable"; }
    }
    const droppedUnverified = [...merged.values()].length - verified.length;
    const riskLevel = calculateRisk(verified);
    const summary = droppedUnverified > 0 || riskLevel !== modelReport.riskLevel
      ? riskSummary(riskLevel, verified.length, droppedUnverified)
      : modelReport.summary;
    const limitations = [...new Set([
      ...modelReport.limitations,
      "Ứng dụng không truy cập website hoặc xác minh người gửi/giao dịch bên ngoài.",
      input.type === "email" ? "Header kỹ thuật email chưa được kiểm chứng từ hộp thư nguồn." : "Kết quả chỉ phản ánh phần nội dung bạn đã cung cấp.",
      input.type === "image" ? (input.confirmedOcr ? "Bản đọc ảnh đã được người dùng xác nhận; chưa xác minh tính thật của hình ảnh hay giao dịch." : "Bản đọc do AI trích xuất và chưa được người dùng xác nhận; hãy đối chiếu trực tiếp với ảnh. Chưa xác minh tính thật của hình ảnh hay giao dịch.") : "",
      droppedUnverified ? "Đã ẩn dấu hiệu không có trích dẫn khớp hoặc bị ngữ cảnh phủ định trong nguồn." : "",
      input.includeJev ? "JEV là lớp đánh giá tùy chọn; các tín hiệu JEV không thay đổi hoặc làm giảm mức cảnh báo từ báo cáo chính." : "",
    ].filter(Boolean))];
    const report = analysisReportSchema.parse({
      schemaVersion: "1.0", id: randomUUID(), createdAt: new Date().toISOString(), type: input.type, riskLevel,
      summary, findings: verified, localFindings,
      aiFindings: process.env.SCAMLENS_DEMO_MODE === "true" ? [] : aiFindings,
      checklist: modelReport.checklist, limitations,
      source: { id: sourceId, content: source, confirmedOcr: input.confirmedOcr, hostname },
      model: { text: actualModel, image: input.type === "image" ? process.env.DEEPSEEK_VISION_MODEL || process.env.DEEPSEEK_MODEL : undefined },
      metrics: { processingMs: Math.max(0, Date.now() - startedAt), aiStatus: process.env.SCAMLENS_DEMO_MODE === "true" ? "demo" : "complete" },
      ...(jevAssessment ? { jev: jevAssessment } : {}),
      evidenceReviews, evidenceReviewStatus,
    });
    return privateJson({ report, demo: process.env.SCAMLENS_DEMO_MODE === "true", saved: false });
  } catch (error) {
    const safe = publicError(error);
    return privateJson({ error: safe.message }, safe.status);
  }
}

function severityValue(value: string) { return value === "high" ? 3 : value === "medium" ? 2 : 1; }
function calculateRisk(findings: Array<{ severity: string }>): ModelReport["riskLevel"] {
  if (findings.some((finding) => finding.severity === "high")) return "high";
  if (findings.some((finding) => finding.severity === "medium")) return "medium";
  if (findings.length) return "low";
  return "insufficient";
}

function riskSummary(risk: ModelReport["riskLevel"], count: number, dropped: number) {
  const evidenceNote = dropped > 0 ? " Một số kết luận AI có trích dẫn không khớp hoặc bị ngữ cảnh phủ định nên đã bị loại." : "";
  if (risk === "high") return `Có ít nhất một dấu hiệu mức cao trong nội dung đã cung cấp. Hãy dừng thao tác và tự xác minh qua kênh chính thức.${evidenceNote}`;
  if (risk === "medium") return `Có ${count} dấu hiệu cần kiểm tra thêm. Kết quả chưa xác minh người gửi hoặc giao dịch.${evidenceNote}`;
  if (risk === "low") return `Chỉ thấy dấu hiệu mức thấp trong phần nội dung hiện có. Điều này không chứng minh nội dung an toàn.${evidenceNote}`;
  return `Chưa đủ bằng chứng để đánh giá nội dung hiện tại. Hãy kiểm tra nguồn qua một kênh độc lập.${evidenceNote}`;
}
