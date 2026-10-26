import { z } from "zod";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/analysis/prompts";
import { modelReportSchema, receiptStructuredSchema, type ModelReport } from "@/lib/analysis/schema";

const CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;
const ocrTextSchema = z.object({
  text: z.string().max(15_000),
  uncertainParts: z.array(z.string().max(200)).max(20).optional().default([]),
  notes: z.array(z.string().max(200)).max(8).optional().default([]),
});
const OCR_SYSTEM_PROMPT = `Bạn là công cụ OCR tiếng Việt. Chỉ đọc chữ nhìn thấy trong ảnh đã được người dùng che dữ liệu riêng tư; không suy đoán chữ mờ, bị che hoặc bị cắt. Ghi phần đọc không chắc trong uncertainParts. Không kết luận ảnh thật/giả hoặc giao dịch thành công. Nếu ảnh có bố cục biên lai, trích xuất thêm structuredData; chỉ điền trường đọc được, không tự bổ sung thông tin vắng mặt. Mọi inconsistencies chỉ là nghi vấn để người dùng kiểm tra.

Chỉ trả về một JSON object hợp lệ theo đúng ví dụ sau, không markdown và không thêm khóa:
{"text":"Nội dung đọc được","uncertainParts":[],"notes":[],"structuredData":{}}

text, uncertainParts và notes luôn bắt buộc. structuredData là tùy chọn; nếu có, chỉ gồm trường nhận diện được, dùng transferType=unknown khi không rõ và inconsistencies là mảng nhận xét thận trọng. Nếu ảnh không đọc được, mô tả giới hạn trong notes; không tự điền nội dung không nhìn thấy.`;
const completionSchema = z.object({
  choices: z.array(z.object({
    finish_reason: z.string().nullable().optional(),
    message: z.object({ content: z.string().nullable().optional() }),
  })).min(1),
  model: z.string().optional(),
  usage: z.object({ prompt_tokens: z.number().int().nonnegative(), completion_tokens: z.number().int().nonnegative() }).optional(),
});

type ImageMime = "image/jpeg" | "image/png" | "image/webp";

function configuredDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim();
  if (!apiKey || !model) throw new Error("deepseek_not_configured");
  return { apiKey, model };
}

function providerError(status: number): Error {
  if (status === 401 || status === 403) return new Error("deepseek_auth_failed");
  if (status === 402) return new Error("deepseek_balance_insufficient");
  if (status === 429) return new Error("deepseek_rate_limited");
  if (status >= 500) return new Error("deepseek_provider_unavailable");
  return new Error("deepseek_request_rejected");
}

type CompletionResult = { content: string; model: string; inputTokens?: number; outputTokens?: number };

async function requestCompletionDetailed(input: {
  messages: Array<Record<string, unknown>>;
  maxTokens: number;
  model?: string;
}): Promise<CompletionResult> {
  const { apiKey, model } = configuredDeepSeek();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model ?? model,
        messages: input.messages,
        max_tokens: input.maxTokens,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw providerError(response.status);

    let payload: unknown;
    try { payload = await response.json(); } catch { throw new Error("deepseek_invalid_response"); }
    const parsed = completionSchema.safeParse(payload);
    if (!parsed.success) throw new Error("deepseek_invalid_response");
    const choice = parsed.data.choices[0];
    if (choice.finish_reason && choice.finish_reason !== "stop") throw new Error("deepseek_invalid_response");
    const content = choice.message.content?.trim();
    if (!content || content.length > 25_000) throw new Error("deepseek_invalid_response");
    return {
      content,
      model: parsed.data.model || input.model || model,
      ...(parsed.data.usage ? { inputTokens: parsed.data.usage.prompt_tokens, outputTokens: parsed.data.usage.completion_tokens } : {}),
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("deepseek_")) throw error;
    if (controller.signal.aborted || (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"))) {
      throw new Error("deepseek_timeout");
    }
    throw new Error("deepseek_network_error");
  } finally {
    clearTimeout(timeout);
  }
}

async function requestCompletion(input: { messages: Array<Record<string, unknown>>; maxTokens: number; model?: string }): Promise<string> {
  return (await requestCompletionDetailed(input)).content;
}

function parseJson(raw: string): unknown {
  try { return JSON.parse(raw) as unknown; } catch { throw new Error("deepseek_invalid_json"); }
}

export async function analyzeWithDeepSeek(prompt: string): Promise<ModelReport> {
  return (await analyzeWithDeepSeekDetailed(prompt)).report;
}

export async function analyzeWithDeepSeekDetailed(prompt: string): Promise<{ report: ModelReport; model: string; inputTokens?: number; outputTokens?: number }> {
  const completion = await requestCompletionDetailed({
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    maxTokens: 3_200,
  });
  const result = modelReportSchema.safeParse(sanitizeModelReport(parseJson(completion.content)));
  if (!result.success) throw new Error("deepseek_invalid_schema");
  return { report: result.data, model: completion.model, ...(completion.inputTokens !== undefined ? { inputTokens: completion.inputTokens } : {}), ...(completion.outputTokens !== undefined ? { outputTokens: completion.outputTokens } : {}) };
}

function sanitizeModelReport(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const report = value as Record<string, unknown>;
  const truncate = (item: unknown, max: number) => typeof item === "string" && item.length > max ? `${item.slice(0, max - 1).trimEnd()}…` : item;
  return {
    ...report,
    summary: truncate(report.summary, 1_500),
    checklist: Array.isArray(report.checklist) ? report.checklist.slice(0, 15).map((item) => truncate(item, 350)) : report.checklist,
    limitations: Array.isArray(report.limitations) ? report.limitations.slice(0, 15).map((item) => truncate(item, 350)) : report.limitations,
  };
}

export async function readImage(image: Buffer, mimeType: ImageMime) {
  const { model: textModel } = configuredDeepSeek();
  const model = process.env.DEEPSEEK_VISION_MODEL?.trim() || textModel;
  const raw = await requestCompletion({
    model,
    messages: [
      {
        role: "system",
        content: OCR_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Đọc nội dung ảnh. Hãy trả JSON đúng nguyên mẫu và quy tắc trong chỉ dẫn hệ thống." },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${image.toString("base64")}`, detail: "original" },
          },
        ],
      },
    ],
    maxTokens: 1_200,
  });
  const parsed = parseJson(raw);
  const result = ocrTextSchema.safeParse(sanitizeOcrText(parsed));
  if (!result.success) throw new Error("deepseek_invalid_schema");

  const structuredData = parseOcrStructuredData(parsed);
  const structuredDataNote = "Một số trường thông tin giao dịch chưa đọc được rõ; vui lòng kiểm tra lại ảnh.";
  const notes = structuredData.invalid && !result.data.notes.includes(structuredDataNote)
    ? [...result.data.notes.slice(0, 7), structuredDataNote]
    : result.data.notes;

  return {
    ...result.data,
    notes,
    ...(structuredData.data ? { structuredData: structuredData.data } : {}),
    model,
  };
}

const receiptStringFields = [
  "bankName", "amountInWords", "senderName", "senderAccount", "recipientName",
  "recipientAccount", "recipientBank", "transactionTime", "referenceNumber",
] as const;

function sanitizeOcrText(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const output = value as Record<string, unknown>;
  const cleanList = (item: unknown, maxItems: number, maxLength: number) =>
    Array.isArray(item)
      ? item.filter((entry): entry is string => typeof entry === "string").slice(0, maxItems).map((entry) => entry.slice(0, maxLength))
      : [];
  return {
    ...output,
    text: typeof output.text === "string" ? output.text.slice(0, 15_000) : output.text,
    uncertainParts: cleanList(output.uncertainParts, 20, 200),
    notes: cleanList(output.notes, 8, 200),
  };
}

function parseOcrStructuredData(value: unknown): { data?: z.infer<typeof receiptStructuredSchema>; invalid: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { invalid: false };
  const raw = (value as Record<string, unknown>).structuredData;
  if (raw === undefined || raw === null) return { invalid: false };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { invalid: true };

  const source = raw as Record<string, unknown>;
  const candidate: Record<string, unknown> = {};
  const stringFieldLimits: Record<(typeof receiptStringFields)[number], number> = {
    bankName: 120,
    amountInWords: 300,
    senderName: 160,
    senderAccount: 80,
    recipientName: 160,
    recipientAccount: 80,
    recipientBank: 120,
    transactionTime: 120,
    referenceNumber: 120,
  };
  let invalid = false;

  for (const key of receiptStringFields) {
    const field = source[key];
    if (field === undefined || field === null || field === "") continue;
    if (typeof field === "string" && field.length <= stringFieldLimits[key]) candidate[key] = field;
    else if (typeof field === "string") invalid = true;
    else invalid = true;
  }

  const amount = source.amount;
  if (typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0) {
    candidate.amount = amount;
  } else if (typeof amount === "string") {
    // Accept only plain digits or Vietnamese-style thousands separators; do not guess decimal values.
    const amountText = amount.trim().replace(/\s*(?:₫|VND)\s*$/i, "").trim();
    const isGroupedInteger = /^\d{1,3}([., ])(\d{3})(?:\1\d{3})*$/.test(amountText);
    const normalized = amountText.replace(/[.,\s]/g, "");
    if ((/^\d{1,15}$/.test(amountText) || isGroupedInteger) && Number.isSafeInteger(Number(normalized))) candidate.amount = Number(normalized);
    else if (amount.trim()) invalid = true;
  } else if (amount !== undefined && amount !== null) {
    invalid = true;
  }

  if (source.transferType === "napas247" || source.transferType === "normal" || source.transferType === "unknown") {
    candidate.transferType = source.transferType;
  } else if (source.transferType !== undefined && source.transferType !== null && source.transferType !== "") {
    candidate.transferType = "unknown";
    invalid = true;
  }

  if (Array.isArray(source.inconsistencies)) {
    const inconsistencies = source.inconsistencies
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, 12)
      .map((item) => item.slice(0, 250));
    candidate.inconsistencies = inconsistencies;
    if (inconsistencies.length !== source.inconsistencies.length) invalid = true;
  } else if (source.inconsistencies !== undefined && source.inconsistencies !== null) {
    invalid = true;
  }

  const result = receiptStructuredSchema.safeParse(candidate);
  return result.success ? { data: result.data, invalid } : { invalid: true };
}
