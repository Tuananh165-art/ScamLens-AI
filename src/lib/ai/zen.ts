import { modelReportSchema, type ModelReport } from "@/lib/analysis/schema";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

export function configuredTextModel(): string {
  return required("AI_MODEL");
}

export async function analyzeWithZen(prompt: string): Promise<ModelReport> {
  const endpoint = required("AI_ENDPOINT");
  const apiKey = required("AI_API_KEY");
  const model = required("AI_MODEL");
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new Error("invalid_ai_endpoint"); }
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("insecure_ai_endpoint");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
    cache: "no-store",
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") throw new Error("ai_timeout");
    throw new Error("ai_network_error");
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("ai_auth_failed");
    if (response.status === 429) throw new Error("ai_rate_limited");
    if (response.status >= 500) throw new Error("ai_provider_unavailable");
    throw new Error("ai_request_rejected");
  }

  const body = await boundedJson(response, 128_000) as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> } | null;
  const content = body?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : content?.map((part) => part.text ?? "").join("");
  if (!text || text.length > 25_000) throw new Error("ai_invalid_response");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("ai_invalid_json"); }
  const result = modelReportSchema.safeParse(parsed);
  if (!result.success) throw new Error("ai_invalid_schema");
  return result.data;
}

async function boundedJson(response: Response, maximumBytes: number): Promise<unknown> {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maximumBytes) throw new Error("ai_invalid_response");
  if (!response.body) throw new Error("ai_invalid_response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw new Error("ai_invalid_response");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error("ai_invalid_json"); }
}

import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/analysis/prompts";
