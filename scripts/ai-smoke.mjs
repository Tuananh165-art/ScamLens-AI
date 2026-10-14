import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const provider = process.argv[2];
if (!["zen", "gemini"].includes(provider)) {
  console.error("Usage: npm run smoke:ai -- zen|gemini");
  process.exit(2);
}

function safeResult(result) {
  console.log(JSON.stringify({ provider, ...result }));
}

if (provider === "zen") {
  const { AI_ENDPOINT: endpoint, AI_API_KEY: key, AI_MODEL: model } = process.env;
  if (!endpoint || !key || !model) {
    safeResult({ ok: false, error: "missing_env", needed: ["AI_ENDPOINT", "AI_API_KEY", "AI_MODEL"] });
    process.exit(1);
  }
  let url;
  try { url = new URL(endpoint); }
  catch { safeResult({ ok: false, error: "invalid_endpoint" }); process.exit(1); }
  if (url.protocol !== "https:") { safeResult({ ok: false, error: "endpoint_must_use_https" }); process.exit(1); }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 120,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Return only JSON with keys: "ok" (boolean) and "riskLevel" (string).' },
          { role: "user", content: "[SAFE TEST] An unknown sender requests an OTP urgently." },
        ],
      }),
    });
    if (!response.ok) {
      safeResult({ ok: false, status: response.status, model, endpoint: `${url.origin}${url.pathname}`, body: "[OMITTED]" });
      process.exit(1);
    }
    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    let validJson = false;
    if (typeof content === "string") { try { JSON.parse(content); validJson = true; } catch { /* Output text is deliberately omitted. */ } }
    safeResult({ ok: validJson, status: response.status, model, endpoint: `${url.origin}${url.pathname}`, validJson });
    if (!validJson) process.exit(1);
  } catch (error) {
    safeResult({ ok: false, error: error?.name === "TimeoutError" ? "timeout" : "network_or_response_error", model, endpoint: `${url.origin}${url.pathname}` });
    process.exit(1);
  }
} else {
  const { GEMINI_API_KEY: key, GEMINI_MODEL: model } = process.env;
  if (!key || !model) {
    safeResult({ ok: false, error: "missing_env", needed: ["GEMINI_API_KEY", "GEMINI_MODEL"] });
    process.exit(1);
  }
  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model,
      contents: [
        { inlineData: { mimeType: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+y0Z8AAAAASUVORK5CYII=" } },
        { text: '[SAFE TEST] This is a one-pixel image. Return only {"ok":true}. Do not infer transaction or identity facts.' },
      ],
      config: {
        maxOutputTokens: 256,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { ok: { type: Type.BOOLEAN } },
          required: ["ok"],
        },
      },
    });
    let validJson = false;
    if (response.text) { try { JSON.parse(response.text); validJson = true; } catch { /* Output text is deliberately omitted. */ } }
    safeResult({
      ok: validJson,
      model,
      validJson,
      finishReason: response.candidates?.[0]?.finishReason,
      blockReason: response.promptFeedback?.blockReason,
      hasText: Boolean(response.text),
      outputCharacters: response.text?.length ?? 0,
    });
    if (!validJson) process.exit(1);
  } catch (error) {
    safeResult({ ok: false, error: "request_or_response_error", code: Number.isInteger(error?.status) ? error.status : undefined, model });
    process.exit(1);
  }
}
