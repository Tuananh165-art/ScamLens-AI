import { z } from "zod";

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
  summary: z.string().trim().min(3).max(600),
  riskLevel: riskLevelSchema,
  findings: z.array(findingSchema).max(12),
  checklist: z.array(z.string().trim().min(5).max(220)).max(8),
  limitations: z.array(z.string().trim().min(5).max(200)).max(8),
});

export const analyzeRequestSchema = z.object({
  type: sourceTypeSchema,
  content: z.string().trim().min(1).max(20_000),
  context: z.string().trim().max(1_000).optional().default(""),
  sender: z.string().trim().max(300).optional().default(""),
  replyTo: z.string().trim().max(300).optional().default(""),
  subject: z.string().trim().max(500).optional().default(""),
  confirmedOcr: z.boolean().optional().default(false),
});

export const evidenceRefSchema = z.object({
  sourceId: z.string(),
  quote: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  confirmedByUser: z.boolean(),
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
  checklist: z.array(z.string()),
  limitations: z.array(z.string()),
  source: z.object({
    id: z.string(),
    content: z.string(),
    confirmedOcr: z.boolean(),
    hostname: z.string().optional(),
  }),
  model: z.object({ text: z.string(), image: z.string().optional() }),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalysisReport = z.infer<typeof analysisReportSchema>;
export type ModelReport = z.infer<typeof modelReportSchema>;
export type Finding = z.infer<typeof findingSchema>;
