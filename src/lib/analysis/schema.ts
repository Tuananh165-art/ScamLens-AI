import { z } from "zod";
import { JEV_SIGNAL_IDS } from "@/lib/ai/jev-signals";

export const sourceTypeSchema = z.enum(["message", "email", "url", "image"]);
export const riskLevelSchema = z.enum(["low", "medium", "high", "insufficient"]);
export const findingCategorySchema = z.enum([
  "impersonation",
  "money_request",
  "urgency",
  "secret_request",
  "suspicious_url",
  "inconsistency",
]);

export const findingSchema = z.object({
  category: findingCategorySchema,
  severity: z.enum(["low", "medium", "high"]),
  title: z.string().trim().min(3).max(100),
  explanation: z.string().trim().min(8).max(700),
  evidence: z.string().trim().min(2).max(300),
});

export const modelReportSchema = z.object({
  summary: z.string().trim().min(3).max(1_500),
  riskLevel: riskLevelSchema,
  findings: z.array(findingSchema).max(12),
  checklist: z.array(z.string().trim().min(3).max(350)).max(15),
  limitations: z.array(z.string().trim().min(3).max(350)).max(15),
});

export const receiptStructuredSchema = z.object({
  bankName: z.string().trim().max(120).optional(),
  amount: z.number().int().nonnegative().optional(),
  amountInWords: z.string().trim().max(300).optional(),
  senderName: z.string().trim().max(160).optional(),
  senderAccount: z.string().trim().max(80).optional(),
  recipientName: z.string().trim().max(160).optional(),
  recipientAccount: z.string().trim().max(80).optional(),
  recipientBank: z.string().trim().max(120).optional(),
  transactionTime: z.string().trim().max(120).optional(),
  referenceNumber: z.string().trim().max(120).optional(),
  transferType: z.enum(["napas247", "normal", "unknown"]).default("unknown"),
  inconsistencies: z.array(z.string().trim().min(1).max(250)).max(12).default([]),
});
export type ReceiptStructuredData = z.infer<typeof receiptStructuredSchema>;

export const analyzeRequestSchema = z.object({
  type: sourceTypeSchema,
  content: z.string().trim().min(1).max(20_000),
  context: z.string().trim().max(1_000).optional().default(""),
  sender: z.string().trim().max(300).optional().default(""),
  replyTo: z.string().trim().max(300).optional().default(""),
  subject: z.string().trim().max(500).optional().default(""),
  confirmedOcr: z.boolean().optional().default(false),
  includeJev: z.boolean().optional().default(false),
  redactionPreferences: z.object({ email: z.boolean().optional(), phone: z.boolean().optional(), identity: z.boolean().optional(), account: z.boolean().optional(), keepValues: z.array(z.string().max(300)).max(100).optional() }).optional(),
});

export const jevAssessmentSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("complete"),
    model: z.string().min(1).max(80),
    sufficiency: z.enum(["usable", "limited", "unusable"]),
    sufficiencyConfidence: z.number().finite().min(0).max(1).optional(),
    questionVersion: z.string().max(40).optional(),
    signals: z.array(z.object({
      id: z.enum(JEV_SIGNAL_IDS),
      probability: z.number().finite().min(0).max(1),
      result: z.enum(["present", "not_detected", "uncertain"]),
    })).min(6).max(JEV_SIGNAL_IDS.length).refine((signals) => new Set(signals.map((signal) => signal.id)).size === signals.length, "JEV signal ids must be unique"),
    diagnostics: z.object({ latencyMs: z.number().int().nonnegative().max(120_000), inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() }).optional(),
  }),
  z.object({ status: z.literal("unavailable"), reason: z.enum(["quota", "provider_error"]) }),
]);

export const evidenceRefSchema = z.object({
  sourceId: z.string(),
  quote: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  confirmedByUser: z.boolean(),
});

export const claimReviewSchema = z.object({
  category: findingCategorySchema,
  claim: z.string().max(1000),
  quote: z.string().max(1000),
  status: z.enum(["supported", "unsupported", "insufficient"]),
  method: z.enum(["local", "jev"]),
  confidence: z.number().min(0).max(1).optional(),
});

export const analysisReportSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  type: sourceTypeSchema,
  riskLevel: riskLevelSchema,
  summary: z.string(),
  findings: z.array(
    findingSchema.extend({
      evidenceRefs: z.array(evidenceRefSchema).min(1),
    }),
  ),
  // Optional for compatibility with reports saved before local checks were exposed.
  localFindings: z.array(findingSchema.extend({ evidenceRefs: z.array(evidenceRefSchema).min(1) })).optional(),
  aiFindings: z.array(findingSchema.extend({ evidenceRefs: z.array(evidenceRefSchema).min(1) })).optional(),
  checklist: z.array(z.string()),
  limitations: z.array(z.string()),
  source: z.object({
    id: z.string(),
    content: z.string(),
    confirmedOcr: z.boolean(),
    hostname: z.string().optional(),
  }),
  model: z.object({ text: z.string(), image: z.string().optional() }),
  metrics: z.object({ processingMs: z.number().int().nonnegative().max(120_000), aiStatus: z.enum(["demo", "complete"]) }).optional(),
  jev: jevAssessmentSchema.optional(),
  evidenceReviews: z.array(claimReviewSchema).max(12).optional(),
  evidenceReviewStatus: z.enum(["disabled", "complete", "unavailable"]).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type AnalysisReport = z.infer<typeof analysisReportSchema>;
export type ModelReport = z.infer<typeof modelReportSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type JevAssessment = z.infer<typeof jevAssessmentSchema>;
export type ClaimReview = z.infer<typeof claimReviewSchema>;
