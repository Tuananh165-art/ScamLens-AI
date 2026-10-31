import { getRuleFindings } from "./rules";
import type { AnalyzeRequest } from "./schema";

export type HeuristicSignal = { id: "urgency" | "credentials" | "impersonation" | "payment" | "url" | "inconsistency"; label: string; evidence: string };

const presentation: Record<string, Pick<HeuristicSignal, "id" | "label">> = {
  secret_request: { id: "credentials", label: "Yêu cầu thông tin xác thực" },
  money_request: { id: "payment", label: "Yêu cầu liên quan đến tiền" },
  urgency: { id: "urgency", label: "Áp lực thời gian" },
  impersonation: { id: "impersonation", label: "Tự xưng tổ chức" },
  suspicious_url: { id: "url", label: "Đặc điểm URL" },
  inconsistency: { id: "inconsistency", label: "Thông tin không khớp" },
};

// Live preview uses the same contextual rules as the server report.
export function detectLiveHeuristics(text: string | AnalyzeRequest): HeuristicSignal[] {
  const request: AnalyzeRequest = typeof text === "string" ? { type: "message", content: text, context: "", sender: "", replyTo: "", subject: "", confirmedOcr: false, includeJev: false } : text;
  return getRuleFindings(request).map((finding) => ({ ...presentation[finding.category], evidence: finding.evidence }));
}
