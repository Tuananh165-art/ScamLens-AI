export const SIGNAL_IDS = [
  "requests_credentials",
  "requests_payment",
  "uses_pressure",
  "claims_authority",
  "bypasses_official_channel",
  "promises_guaranteed_return",
] as const;

export type SignalId = (typeof SIGNAL_IDS)[number];
export type Sufficiency = "usable" | "limited" | "unusable";
export type EvidenceDecision = "supported" | "unsupported" | "insufficient";
export type EvaluationSplit = "dev" | "test";

export type BenchmarkSample = {
  id: string;
  familyId: string;
  sourceType: "message" | "email" | "url" | "image";
  variant: "plain" | "no_diacritics" | "quoted" | "injection";
  input: {
    type: "message" | "email" | "url" | "image";
    content: string;
    context?: string;
    sender?: string;
    replyTo?: string;
    subject?: string;
  };
  labels: { signals: Record<SignalId, boolean>; sufficiency: Sufficiency; group: "suspicious" | "benign" | "insufficient" };
};

export type EvidencePair = {
  id: string;
  familyId: string;
  source: string;
  claim: string;
  quote: string;
  expected: EvidenceDecision;
};

export type JevSignalAssessment = {
  probabilities: Record<SignalId, number>;
  sufficiency: Sufficiency;
  sufficiencyConfidence: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  usage: { inputTokens: number; outputTokens: number };
  latencyMs: number;
};

export type JevEvidenceAssessment = {
  decision: EvidenceDecision;
  probabilities: Record<EvidenceDecision, number>;
  confidence: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  usage: { inputTokens: number; outputTokens: number };
  latencyMs: number;
};

export type EvaluationRecord = {
  sampleId: string;
  familyId: string;
  provider: "typesafe" | "deepseek-rules" | "deepseek-ai";
  model: string;
  outcome: "success" | "error";
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  signals?: Partial<Record<SignalId, number>>;
  supportedSignals?: SignalId[];
  split?: EvaluationSplit;
  sufficiency?: Sufficiency;
  evidenceDecision?: EvidenceDecision;
  errorCode?: string;
};

