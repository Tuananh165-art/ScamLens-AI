import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithDeepSeek, readImage } from "./deepseek";
import { publicError } from "./errors";

const report = {
  summary: "Nội dung yêu cầu mã xác thực.",
  riskLevel: "high",
  findings: [{
    category: "secret_request",
    severity: "high",
    title: "Yêu cầu OTP",
    explanation: "Không chia sẻ mã xác thực với người gửi.",
    evidence: "Gửi OTP ngay",
  }],
  checklist: ["Tự mở ứng dụng chính thức để kiểm tra."],
  limitations: ["Chưa xác minh danh tính người gửi."],
};

function mockCompletion(content: string, finishReason = "stop") {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ finish_reason: finishReason, message: { content } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } })));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("DeepSeek adapter", () => {
  it("requests JSON mode from configured model and validates report schema", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify(report));

    await expect(analyzeWithDeepSeek("SOURCE: Gửi OTP ngay")).resolves.toMatchObject(report);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "deepseek-v4-flash",
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
    });
  });

  it("sends the redacted image inline and validates OCR JSON", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify({ text: "Nội dung đã che", uncertainParts: [], notes: [] }));

    const result = await readImage(Buffer.from([1, 2, 3]), "image/png");
    expect(result.text).toBe("Nội dung đã che");
    expect(result.model).toBe("deepseek-v4-flash");
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(request.messages[1].content[1].image_url.url).toBe("data:image/png;base64,AQID");
  });

  it("maps DeepSeek rate limiting to HTTP 429 without exposing provider data", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider body", { status: 429 })));

    await expect(analyzeWithDeepSeek("sample")).rejects.toThrow("deepseek_rate_limited");
    expect(publicError(new Error("deepseek_rate_limited"))).toEqual({
      status: 429,
      message: "DeepSeek đã giới hạn lượt gọi. Hãy thử lại sau.",
    });
  });

  it("rejects models outside the supported DeepSeek vision model set", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-pro");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(readImage(Buffer.from([1]), "image/png")).rejects.toThrow("deepseek_vision_model_unsupported");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
