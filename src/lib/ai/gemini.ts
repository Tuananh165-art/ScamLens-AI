import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const ocrSchema = z.object({
  text: z.string().max(15_000),
  uncertainParts: z.array(z.string().max(200)).max(20),
  notes: z.array(z.string().max(200)).max(8),
});

export async function readImage(image: Buffer, mimeType: "image/jpeg" | "image/png" | "image/webp") {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim();
  if (!key || !model) throw new Error("gemini_not_configured");

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
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

  const raw = response.text;
  if (!raw || raw.length > 18_000) throw new Error("gemini_invalid_response");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("gemini_invalid_json"); }
  const result = ocrSchema.safeParse(parsed);
  if (!result.success) throw new Error("gemini_invalid_schema");
  return { ...result.data, model };
}
