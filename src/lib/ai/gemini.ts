import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/analysis/prompts";
import { modelReportSchema, type ModelReport } from "@/lib/analysis/schema";

const ocrSchema = z.object({
  text: z.string().max(15_000),
  uncertainParts: z.array(z.string().max(200)).max(20),
  notes: z.array(z.string().max(200)).max(8),
});

const reportResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, minLength: "3", maxLength: "600" },
    riskLevel: { type: Type.STRING, enum: ["low", "medium", "high", "insufficient"] },
    findings: {
      type: Type.ARRAY,
      maxItems: "12",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ["impersonation", "money_request", "urgency", "secret_request", "suspicious_url", "inconsistency"] },
          severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          title: { type: Type.STRING, minLength: "3", maxLength: "100" },
          explanation: { type: Type.STRING, minLength: "8", maxLength: "700" },
          evidence: { type: Type.STRING, minLength: "2", maxLength: "300" },
        },
        required: ["category", "severity", "title", "explanation", "evidence"],
      },
    },
    checklist: { type: Type.ARRAY, maxItems: "8", items: { type: Type.STRING, minLength: "5", maxLength: "220" } },
    limitations: { type: Type.ARRAY, maxItems: "8", items: { type: Type.STRING, minLength: "5", maxLength: "200" } },
  },
  required: ["summary", "riskLevel", "findings", "checklist", "limitations"],
};

const modelReportResponseSchema = modelReportSchema;

function configuredGemini() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim();
  if (!key) throw new Error("gemini_not_configured");
  if (!model) throw new Error("gemini_not_configured");
  return { ai: new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 45_000 } }), model };
}

function providerError(error: unknown): Error {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return new Error("gemini_timeout");
  const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
  if (status === 401 || status === 403) return new Error("gemini_auth_failed");
  if (status === 429) return new Error("gemini_rate_limited");
  if (status >= 500) return new Error("gemini_provider_unavailable");
  if (status >= 400) return new Error("gemini_request_rejected");
  return new Error("gemini_network_error");
}

export async function analyzeWithGemini(prompt: string): Promise<ModelReport> {
  const { ai, model } = configuredGemini();
  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: ANALYSIS_SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 3200,
        responseMimeType: "application/json",
        responseSchema: reportResponseSchema,
      },
    });
  } catch (error) {
    throw providerError(error);
  }

  const raw = response.text;
  if (!raw || raw.length > 25_000) throw new Error("gemini_invalid_response");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("gemini_invalid_json"); }
  const result = modelReportResponseSchema.safeParse(parsed);
  if (!result.success) throw new Error("gemini_invalid_schema");
  return result.data;
}

export async function readImage(image: Buffer, mimeType: "image/jpeg" | "image/png" | "image/webp") {
  const { ai, model } = configuredGemini();
  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [
        { inlineData: { data: image.toString("base64"), mimeType } },
        { text: "Đọc chính xác chữ tiếng Việt và các chữ/số dễ nhầm từ ảnh đã được che dữ liệu riêng tư. Không suy đoán chữ bị cắt hoặc mờ; ghi phần không chắc vào uncertainParts. Không kết luận ảnh thật/giả hay giao dịch thành công. Trả lời bằng tiếng Việt, JSON theo schema." },
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            uncertainParts: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["text", "uncertainParts", "notes"],
        },
      },
    });
  } catch (error) {
    throw providerError(error);
  }

  const raw = response.text;
  if (!raw || raw.length > 18_000) throw new Error("gemini_invalid_response");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("gemini_invalid_json"); }
  const result = ocrSchema.safeParse(parsed);
  if (!result.success) throw new Error("gemini_invalid_schema");
  return { ...result.data, model };
}
