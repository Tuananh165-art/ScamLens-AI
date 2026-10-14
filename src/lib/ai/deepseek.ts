import { z } from "zod";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/analysis/prompts";
import { modelReportSchema, type ModelReport } from "@/lib/analysis/schema";

const CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;
const ocrSchema = z.object({
  text: z.string().max(15_000),
  uncertainParts: z.array(z.string().max(200)).max(20),
  notes: z.array(z.string().max(200)).max(8),
});
const completionSchema = z.object({
  choices: z.array(z.object({
    finish_reason: z.string().nullable().optional(),
    message: z.object({ content: z.string().nullable().optional() }),
  })).min(1),
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

async function requestCompletion(input: {
  messages: Array<Record<string, unknown>>;
  maxTokens: number;
}): Promise<string> {
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
        model,
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
    return content;
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

function parseJson(raw: string): unknown {
  try { return JSON.parse(raw) as unknown; } catch { throw new Error("deepseek_invalid_json"); }
}

export async function analyzeWithDeepSeek(prompt: string): Promise<ModelReport> {
  const raw = await requestCompletion({
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    maxTokens: 3_200,
  });
  const result = modelReportSchema.safeParse(parseJson(raw));
  if (!result.success) throw new Error("deepseek_invalid_schema");
  return result.data;
}

export async function readImage(image: Buffer, mimeType: ImageMime) {
  const { model } = configuredDeepSeek();
  if (!["deepseek-flash", "deepseek-v4-flash", "deepseek-v4-flash-vision-exp"].includes(model)) {
    throw new Error("deepseek_vision_model_unsupported");
  }
  const raw = await requestCompletion({
    messages: [
      {
        role: "system",
        content: "Bạn là công cụ OCR tiếng Việt. Đọc chính xác chữ trong ảnh đã được người dùng che dữ liệu riêng tư. Không suy đoán chữ mờ/bị cắt; ghi phần không chắc trong uncertainParts. Không kết luận ảnh thật/giả hay giao dịch thành công. Chỉ trả JSON có các khóa text, uncertainParts, notes; không thêm văn bản ngoài JSON.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Đọc nội dung ảnh và trả JSON theo yêu cầu. Nếu không có chữ đọc được, để text rỗng và mô tả giới hạn trong notes." },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${image.toString("base64")}`, detail: "original" },
          },
        ],
      },
    ],
    maxTokens: 1_200,
  });
  const result = ocrSchema.safeParse(parseJson(raw));
  if (!result.success) throw new Error("deepseek_invalid_schema");
  return { ...result.data, model };
}
