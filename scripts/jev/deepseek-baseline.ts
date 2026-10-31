import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from "@/lib/analysis/prompts";
import { getRuleFindings } from "@/lib/analysis/rules";
import { analyzeWithDeepSeekDetailed } from "@/lib/ai/deepseek";
import type { AnalyzeRequest } from "@/lib/analysis/schema";
import type { BenchmarkSample, EvaluationRecord, SignalId } from "./contracts";
import { actualProviderCost, estimateProviderCost } from "./budget";

const categoryToSignal: Partial<Record<string, SignalId>> = {
  secret_request: "requests_credentials",
  money_request: "requests_payment",
  urgency: "uses_pressure",
  impersonation: "claims_authority",
};

function asAnalysisRequest(sample: BenchmarkSample): AnalyzeRequest {
  return {
    type: sample.input.type,
    content: sample.input.content,
    context: sample.input.context ?? "",
    sender: sample.input.sender ?? "",
    replyTo: sample.input.replyTo ?? "",
    subject: sample.input.subject ?? "",
    confirmedOcr: sample.input.type === "image",
    includeJev: false,
  };
}

export async function runRulesBaseline(sample: BenchmarkSample): Promise<EvaluationRecord> {
  const started = performance.now();
  const findings = getRuleFindings(asAnalysisRequest(sample));
  const signals = Object.fromEntries([
    ["requests_credentials", "secret_request"],
    ["requests_payment", "money_request"],
    ["uses_pressure", "urgency"],
    ["claims_authority", "impersonation"],
  ].map(([signal, category]) => [signal, findings.some((finding) => finding.category === category) ? 1 : 0])) as Partial<Record<SignalId, number>>;
  return {
    sampleId: sample.id,
    familyId: sample.familyId,
    provider: "deepseek-rules",
    model: "scamlens-rules-v1",
    outcome: "success",
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    latencyMs: Math.round(performance.now() - started),
    signals,
    supportedSignals: ["requests_credentials", "requests_payment", "uses_pressure", "claims_authority"],
    sufficiency: sample.input.content.length < 18 ? "unusable" : "usable",
  };
}

function sourceFor(sample: BenchmarkSample) {
  return [
    sample.input.sender && `Người gửi: ${sample.input.sender}`,
    sample.input.replyTo && `Reply-To: ${sample.input.replyTo}`,
    sample.input.subject && `Tiêu đề: ${sample.input.subject}`,
    `Nội dung: ${sample.input.content}`,
    sample.input.context && `Ngữ cảnh: ${sample.input.context}`,
  ].filter(Boolean).join("\n");
}

export function buildDeepSeekBaselinePrompt(sample: BenchmarkSample) {
  const request = asAnalysisRequest(sample);
  const ruleFindings = getRuleFindings(request);
  return {
    ruleFindings,
    prompt: buildAnalysisPrompt({
      type: request.type,
      content: sourceFor(sample),
      context: request.context ?? "",
      sender: request.sender ?? "",
      replyTo: request.replyTo ?? "",
      subject: request.subject ?? "",
      ruleFindings,
    }),
  };
}

export function estimateDeepSeekBaselineCost(sample: BenchmarkSample) {
  const { prompt } = buildDeepSeekBaselinePrompt(sample);
  const requestBytes = Buffer.byteLength(JSON.stringify({
    model: process.env.DEEPSEEK_MODEL || "",
    messages: [{ role: "system", content: ANALYSIS_SYSTEM_PROMPT }, { role: "user", content: prompt }],
    max_tokens: 3_200,
    response_format: { type: "json_object" },
    thinking: { type: "disabled" },
  }), "utf8");
  return estimateProviderCost("deepseek-ai", requestBytes);
}

export function deepSeekPayloadForEstimate(sample: BenchmarkSample) {
  return {
    model: process.env.DEEPSEEK_MODEL || "",
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: buildDeepSeekBaselinePrompt(sample).prompt },
    ],
    max_tokens: 3_200,
    response_format: { type: "json_object" },
    thinking: { type: "disabled" },
  };
}

export async function runDeepSeekBaseline(sample: BenchmarkSample): Promise<EvaluationRecord> {
  const started = performance.now();
  const { prompt } = buildDeepSeekBaselinePrompt(sample);
  const result = await analyzeWithDeepSeekDetailed(prompt);
  if (result.inputTokens === undefined || result.outputTokens === undefined) throw new Error("deepseek_usage_missing");
  const signals = Object.fromEntries(Object.keys(categoryToSignal).map((category) => {
    const signal = categoryToSignal[category]!;
    return [signal, result.report.findings.some((finding) => finding.category === category) ? 1 : 0];
  })) as Partial<Record<SignalId, number>>;
  // The legacy report has no equivalent output for these two indicators.
  const measuredCost = actualProviderCost("deepseek-ai", result.inputTokens, result.outputTokens);
  return {
    sampleId: sample.id,
    familyId: sample.familyId,
    provider: "deepseek-ai",
    model: result.model,
    outcome: "success",
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    estimatedCostUsd: measuredCost,
    latencyMs: Math.round(performance.now() - started),
    signals,
    supportedSignals: ["requests_credentials", "requests_payment", "uses_pressure", "claims_authority"],
    sufficiency: result.report.riskLevel === "insufficient" ? "unusable" : "usable",
  };
}
